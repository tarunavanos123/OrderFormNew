import { LightningElement,track,api,wire } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import updateOrderRecord from '@salesforce/apex/OrderForm.updateOrderRecord';


const FIELDS = [
    'SAP_Account__c.Name',
    'SAP_Account__c.GB_Street_House_No__c',
    'SAP_Account__c.GB_Street_2__c',
    'SAP_Account__c.GB_State_Province__c',
    'SAP_Account__c.GB_Zip_Postal_Code__c',
    'SAP_Account__c.Last_Name__c',
    'SAP_Account__c.First_Name__c',
    'SAP_Account__c.Salutation__c',
    'SAP_Account__c.Without_Rx__c',
    'SAP_Account__c.PO__c',
    'SAP_Account__c.Customer_Trade_Class__c',
    'SAP_Account__c.Company_Name__c',
    'SAP_Account__c.Fax__c',
    'SAP_Account__c.GB_City__c',
    'SAP_Account__c.Email__c',
    'SAP_Account__c.Phone__c'

];


export default class CustomerForm extends LightningElement {

    @track customer = {
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
        SameAddress:false,
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
        { label: 'Individual', value: 'Individual' },
        { label: 'Business', value: 'Business' }
    ];

    salutationOptions = [
        { label: 'Mr.', value: 'Mr.' },
        { label: 'Ms.', value: 'Ms.' },
        { label: 'Dr.', value: 'Dr.' },
        { label: 'Mrs.', value: 'Mrs.' },
        { label: 'Prof.', value: 'Prof.' },
        { label: 'Mx.', value: 'Mx.' }
    ];

   @wire(getRecord, { recordId: '$currentrecord', fields: FIELDS })
   wiredAccount ({ error, data }) {
    if (data) {
        this.customer.Salutation = data.fields.Salutation__c ? data.fields.Salutation__c.value : '';
        this.customer.FirstName = data.fields.First_Name__c ? data.fields.First_Name__c.value : '';
        this.customer.LastName = data.fields.Last_Name__c ? data.fields.Last_Name__c.value : '';
        this.customer.WithoutRx = data.fields.Without_Rx__c ? data.fields.Without_Rx__c.value : '';
        this.customer.PO = data.fields.PO__c ? data.fields.PO__c.value : '';
        this.customer.CustomerTradeClass = data.fields.Customer_Trade_Class__c ? data.fields.Customer_Trade_Class__c.value : '';
        this.customer.CompanyName = data.fields.Company_Name__c.value;
        this.customer.Fax = data.fields.Fax__c.value;
        this.customer.BillingAddress.billingState = data.fields.GB_State_Province__c.value;
        this.customer.BillingAddress.billingStreet = data.fields.GB_Street_House_No__c.value;
        this.customer.BillingAddress.billingZipCode = data.fields.GB_Zip_Postal_Code__c.value;
        this.customer.BillingAddress.billingCity = data.fields.GB_City__c.value;
        this.customer.Email = data.fields.Email__c.value;
        this.customer.Phone = data.fields.Phone__c.value;
        this.isReadOnly = true;
        this.error = undefined;
    } else if (error) {
        this.error = error;
        console.log('error>>'+error);
        console.log('jsonError>>'+JSON.stringify(error));
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
         }

         // change this JSON if we want to update the click of progress indicator on each step
         const staticStepStatus = {
            step1: true,
            step2: false,
            step3: false,
            step4: false,
            step5: false
        };
        const stepUpdateEvent = new CustomEvent('stepupdate', {
            detail: { staticStepStatus }
        });

        this.dispatchEvent(stepUpdateEvent);
    }

    renderedCallback(){
        let isValid = true;
        const inputs = this.template.querySelectorAll('[data-group="formInput"]');

        inputs.forEach((input) => {
            if (!input.checkValidity()) {
                isValid = false;
            }
        });


        this.dispatchEvent(
            new CustomEvent('formvalidation', {
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

        updateOrderRecord({ customerData: `${JSON.stringify(jsonData)}`, isOrderAlreadyCreated : `${isOrderAlreadyCreated}`})
            .then(result => {
                this.records = result; 
                    jsonData.orderFormId = result;
                    sessionStorage.setItem('orderFormData',JSON.stringify(jsonData));
            })
    }

    handleInputChange(event) {
        const field = event.target.dataset.id.replace(' ', '');

        if (event.target.classList.contains('billingAddress')){
            if (event.target.classList.contains('zipcode')){
                const input = event.target.value;
                const sanitizedInput = input.replace(/[^0-9\-]/g, '');
                event.target.value = sanitizedInput;
                this.customer.BillingAddress[field] = event.target.value;
            } else{
                this.customer.BillingAddress[field] = event.target.value;
            }

        } else if (event.target.classList.contains('shippingAddress')) {
            if (event.target.classList.contains('zipcode')){
                const input = event.target.value;
                const sanitizedInput = input.replace(/[^0-9\-]/g, '');
                event.target.value = sanitizedInput;
                this.customer.ShippingAddress[field] = event.target.value;
            } else{
                this.customer.ShippingAddress[field] = event.target.value;
            }
        } else if ( event.target.classList.contains('fax')) {
            const input = event.target.value;
            const sanitizedInput = input.replace(/[^0-9]/g, '');
            event.target.value = sanitizedInput;
            this.customer[field] = event.target.value;
        } else {
            this.customer[field] = event.target.value;
        }

        if (field === 'SameAddress'){
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

        const inputs = this.template.querySelectorAll('[data-group="formInput"]');

        inputs.forEach((input) => {
            if (!input.checkValidity()) {
                isValid = false;
            }
        });

        this.dispatchEvent(
            new CustomEvent('formvalidation', {
                detail: { isValid }
            })
        );
    }

    handleCheckboxChange(event) {
        const field = event.target.dataset.id.replace(' ', '');
        this.customer[field] = event.target.checked;
    }

      handleAdressCheckboxChange(event) {
        this.customer.SameAddress = event.target.checked;
        if (this.customer.SameAddress){
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