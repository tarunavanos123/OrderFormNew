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
            Street: '',
             City: '',
             State: '',
             ZipCode: ''
        },
        BillingAddress: {
            Street: '',
            City: '',
            State: '',
            ZipCode: ''
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
        { label: 'Dr.', value: 'Dr.' }
    ];

   @wire(getRecord, { recordId: '$currentrecord', fields: FIELDS })
   wiredAccount ({ error, data }) {
    if (data) {
        this.customer.Salutation = data.fields.Salutation__c.value;
        this.customer.FirstName = data.fields.First_Name__c.value;
        this.customer.LastName = data.fields.Last_Name__c.value;
        this.customer.WithoutRx = data.fields.Without_Rx__c.value;
        this.customer.PO = data.fields.PO__c.value;
        this.customer.CustomerTradeClass = data.fields.Customer_Trade_Class__c.value;
        this.customer.CompanyName = data.fields.Company_Name__c.value;
        this.customer.Fax = data.fields.Fax__c.value;
        this.customer.ShippingAddress.State = data.fields.GB_State_Province__c.value;
        this.customer.ShippingAddress.Street = data.fields.GB_Street_House_No__c.value;
        this.customer.ShippingAddress.ZipCode = data.fields.GB_Zip_Postal_Code__c.value;
        this.customer.ShippingAddress.City = data.fields.GB_City__c.value;
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
         }

    }

    renderedCallback(){
        let isValid = false;

        const inputs = this.template.querySelectorAll('[data-group="formInput"]');
        if(this.customer.LastName != '') {
            isValid = true;
        }
        inputs.forEach((input) => {
            if (!input.checkValidity()) {
                isValid = false;
            } else {
                isValid = true;
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

        if (event.target.classList.contains('shippingAddress')){
            this.customer.ShippingAddress[field] = event.target.value;
        } else if (event.target.classList.contains('billingAddress')) {
            this.customer.BillingAddress[field] = event.target.value;
        } else{
            this.customer[field] = event.target.value;
        }

        if (field === 'SameAddress'){
            this.customer.BillingAddress = { ...this.customer.ShippingAddress };
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
                this.isValid = false;
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
            this.customer.BillingAddress = { ...this.customer.ShippingAddress };
        }
    }
}