import { LightningElement,track,api,wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import updateOrderRecord from '@salesforce/apex/OrderForm.updateOrderRecord';


const FIELDS = [
    'Order_Form__c.Name',
    'Order_Form__c.Billing_Street__c',
    'Order_Form__c.Shipping_Street__c',
    'Order_Form__c.Billing_State__c',
    'Order_Form__c.Billing_Zip_Postal_Code__c',
    'Order_Form__c.Last_Name__c',
    'Order_Form__c.First_Name__c',
    'Order_Form__c.Salutation__c',
    'Order_Form__c.Without_Rx__c',
    'Order_Form__c.PO__c',
    'Order_Form__c.Customer_Trade_Class__c',
    'Order_Form__c.Company_Name__c',
    'Order_Form__c.Fax__c',
    'Order_Form__c.Billing_City__c',
    'Order_Form__c.Email__c',
    'Order_Form__c.Phone__c'
];


export default class CustomerForm extends LightningElement {

    @track customer = {
        //SAPAccount: false,
        CompanyName: '',
        PO: '',
        CustomerTradeClass: '',
        Salutation: '',
        FirstName: '',
        LastName: '',
        Email: '',
        Phone: '',
        Fax: '',
        WithoutRx: false,
        SameAddress: false,
        ShippingAddress: {
            shippingStreet: '',
            shippingCity: '',
            shippingState: '',
            shippingZipCode: ''
        },
        BillingAddress: {
            billingStreet: '',
            billingCity: '',
            billingState: '',
            billingZipCode: ''
        }
    }
    @track lastNameError = false;
    @track emailError = false;

    @api currentrecord;
    @track isReadOnly = false;


    customerTradeClassOptions = [
        { label: 'List Pricing',value: 'List Pricing' },
        { label: 'Government Pricing',value: 'Government Pricing' }
    ];

    salutationOptions = [
        { label: 'Mr.',value: 'Mr.' },
        { label: 'Ms.',value: 'Ms.' },
        { label: 'Dr.',value: 'Dr.' },
        { label: 'Mrs.',value: 'Mrs.' },
        { label: 'Prof.',value: 'Prof.' },
        { label: 'Mx.',value: 'Mx.' }
    ];

    @wire(getRecord,{ recordId: '$currentrecord',fields: FIELDS })
    wiredAccount({ error,data }) {
        if (data) {
            this.customer.Salutation = data.fields.Salutation__c.value;
            this.customer.FirstName = data.fields.First_Name__c.value;
            this.customer.LastName = data.fields.Last_Name__c.value;
            this.customer.WithoutRx = data.fields.Without_Rx__c.value;
            this.customer.PO = data.fields.PO__c.value;
            this.customer.CustomerTradeClass = data.fields.Customer_Trade_Class__c.value;
            this.customer.CompanyName = data.fields.Company_Name__c.value;
            this.customer.Fax = data.fields.Fax__c.value;
            this.customer.BillingAddress.billingState = data.fields.Billing_State__c.value;
            this.customer.BillingAddress.billingStreet = data.fields.Billing_Street__c.value;
            this.customer.BillingAddress.billingZipCode = data.fields.Billing_Zip_Postal_Code__c.value;
            this.customer.BillingAddress.billingCity = data.fields.Billing_City__c.value;
            this.customer.Email = data.fields.Email__c.value;
            this.customer.Phone = data.fields.Phone__c.value;
            this.isReadOnly = true;
            this.error = undefined;
        } else if (error) {
            this.error = error;
            this.customer = null;
        }
    }

    connectedCallback() {
        // Retrieve JSON data from sessionStorage when the component reconnects
        const storedData = sessionStorage.getItem('orderFormData');
        if (storedData) {
            var parsedJson = JSON.parse(storedData);
            if (parsedJson?.CustomerData) {
                this.customer = parsedJson.CustomerData;
            }
            // if (this.customer.SAPAccount) {
            //     this.isReadOnly = true;
            // }
        }

        // change this JSON if we want to update the click of progress indicator on each step
        const staticStepStatus = {
            step1: true,
            step2: false,
            step3: false,
            step4: false,
            step5: false
        };
        const stepUpdateEvent = new CustomEvent('stepupdate',{
            detail: { staticStepStatus }
        });

        this.dispatchEvent(stepUpdateEvent);
    }

    renderedCallback() {
        let isValid = true;
        const inputs = this.template.querySelectorAll('[data-group="formInput"]');

        inputs.forEach((input) => {
            if (!input.checkValidity()) {
                isValid = false;
            }
        });

        this.dispatchEvent(
            new CustomEvent('formvalidation',{
                detail: { isValid }
            })
        );

    }

    disconnectedCallback() {

        let jsonData = sessionStorage.getItem('orderFormData');
        jsonData = jsonData ? JSON.parse(jsonData) : {};
        jsonData.CustomerData = this.customer;
        sessionStorage.setItem('orderFormData',JSON.stringify(jsonData));

        let isOrderAlreadyCreated = jsonData.orderFormId && jsonData.orderFormId != '' ? true : false;

        updateOrderRecord({ customerData: `${JSON.stringify(jsonData)}`,isOrderAlreadyCreated: `${isOrderAlreadyCreated}` })
            .then(result => {
                this.records = result;
                jsonData.orderFormId = result;
                sessionStorage.setItem('orderFormData',JSON.stringify(jsonData));
            })
    }

    handleInputChange(event) {
        const field = event.target.dataset.id.replace(' ','');

        if (event.target.classList.contains('billingAddress')) {
            if (event.target.classList.contains('zipcode')) {
                const input = event.target.value;
                const sanitizedInput = input.replace(/[^0-9\-]/g,'');
                event.target.value = sanitizedInput;
                this.customer.BillingAddress[field] = event.target.value;
            } else {
                this.customer.BillingAddress[field] = event.target.value;
            }
        } else if (event.target.classList.contains('shippingAddress')) {
            if (event.target.classList.contains('zipcode')) {
                const input = event.target.value;
                const sanitizedInput = input.replace(/[^0-9\-]/g,'');
                event.target.value = sanitizedInput;
                this.customer.ShippingAddress[field] = event.target.value;
            } else {
                this.customer.ShippingAddress[field] = event.target.value;
            }
        } else if (event.target.classList.contains('fax')) {
            const input = event.target.value;
            const sanitizedInput = input.replace(/[^0-9]/g,'');
            event.target.value = sanitizedInput;
            this.customer[field] = event.target.value;
        } else {
            this.customer[field] = event.target.value;
        }

        if (field === 'SameAddress') {
            this.customer.ShippingAddress.shippingState = this.customer.BillingAddress.billingState;
            this.customer.ShippingAddress.shippingStreet = this.customer.BillingAddress.billingStreet;
            this.customer.ShippingAddress.shippingZipCode = this.customer.BillingAddress.billingZipCode;
            this.customer.ShippingAddress.shippingCity = this.customer.BillingAddress.billingCity;
        }

        this.validateForm(event);
    }

    validateForm(event) {
        let isValid = true;

        if (!event.target.reportValidity()) {
            isValid = false;
        }

        const inputfield = event.target;
        if (inputfield.classList.contains('email')) {
            const value = inputfield.value;
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(value)) {
                inputfield.setCustomValidity('Please enter a valid Email.');
            } else {
                inputfield.setCustomValidity('');
            }
            inputfield.reportValidity();
            isValid = false;
        }
        const inputs = this.template.querySelectorAll('[data-group="formInput"]');

        inputs.forEach((input) => {
            if (!input.checkValidity()) {
                isValid = false;
            }
        });

        this.dispatchEvent(
            new CustomEvent('formvalidation',{
                detail: { isValid }
            })
        );
    }

    handleCheckboxChange(event) {
        const field = event.target.dataset.id.replace(' ','');
        this.customer[field] = event.target.checked;
    }

    handleAdressCheckboxChange(event) {
        this.customer.SameAddress = event.target.checked;
        if (this.customer.SameAddress) {
            this.customer.ShippingAddress.shippingState = this.customer.BillingAddress.billingState;
            this.customer.ShippingAddress.shippingStreet = this.customer.BillingAddress.billingStreet;
            this.customer.ShippingAddress.shippingZipCode = this.customer.BillingAddress.billingZipCode;
            this.customer.ShippingAddress.shippingCity = this.customer.BillingAddress.billingCity;
        } else {
            this.customer.ShippingAddress.shippingState = '';
            this.customer.ShippingAddress.shippingStreet = '';
            this.customer.ShippingAddress.shippingZipCode = '';
            this.customer.ShippingAddress.shippingCity = '';
        }
    }
}