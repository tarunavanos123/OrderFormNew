import { LightningElement,track,api } from 'lwc';
import searchAccounts from '@salesforce/apex/AccountRecordPicker.searchAccounts';


export default class CustomerPage extends LightningElement {

    @api label = 'Customer Lookup   ';   // Custom label for the component
    @api selectedRecordId = '';     // Stores the selected record's Id
    @api selectedRecordName = '';   // Stores the selected record's Name
    @track searchTerm = '';         // Stores the user's search input
    @track records = [];            // Stores the search results (filtered records)
    @track isDropdownVisible = false; // Controls visibility of the dropdown
    @track isLoading = false;       // Loading indicator while fetching records

    isRegisterCustomer = true;
    @track enableNextButton = false;

    @track newCustomerVariant = 'neutral';
    @track registerCustomerVariant = 'brand';

    @track accountId;
    @track customerType;


    handleRecordChange(event) {
        this.accountId = event.detail.recordId;
        this.enableNextButton = true;
        const recordIdEvent = new CustomEvent('recordevent',{ detail: { 'accountId': this.accountId,'showNextButton': this.enableNextButton,'fromCustomerTypeForm': true } });
        this.dispatchEvent(recordIdEvent);
    }

    newHandleClick() {

        sessionStorage.removeItem('orderFormData');
        this.customerType = 'New Customer'
        this.searchTerm = '';
        let jsonData = sessionStorage.getItem('orderFormData');
        jsonData = jsonData ? JSON.parse(jsonData) : {};
        jsonData.customerType = this.customerType;
        this.accountId = 'null';
        this.enableNextButton = true;
        const recordIdEvent = new CustomEvent('recordevent',{ detail: { 'accountId': this.accountId,'showNextButton': this.enableNextButton,'fromCustomerTypeForm': true } });
        this.dispatchEvent(recordIdEvent);
        this.isRegisterCustomer = false;
        this.newCustomerVariant = 'brand';
        this.registerCustomerVariant = 'neutral';
        sessionStorage.setItem('orderFormData',JSON.stringify(jsonData));
    }

    handleClear(event) {
        if (!event.target.value.length) {
            this.accountId = 'null';
            this.enableNextButton = false;
            const recordIdEvent = new CustomEvent('recordevent',{ detail: { 'accountId': this.accountId,'showNextButton': this.enableNextButton,'fromCustomerTypeForm': false } });
            this.dispatchEvent(recordIdEvent);
        }
    }

    regHandleClick() {
        this.isRegisterCustomer = true;
        let jsonData = sessionStorage.getItem('orderFormData');
        jsonData = jsonData ? JSON.parse(jsonData) : {};
        this.customerType = 'Existing Customer';
        jsonData.customerType = this.customerType;
        sessionStorage.setItem('orderFormData',JSON.stringify(jsonData));
        this.enableNextButton = false;
        const recordIdEvent = new CustomEvent('recordevent',{ detail: { 'accountId': this.accountId,'showNextButton': this.enableNextButton,'fromCustomerTypeForm': true } });
        this.dispatchEvent(recordIdEvent);
        this.newCustomerVariant = 'neutral';
        this.registerCustomerVariant = 'brand';
    }

    // Handle search input change
    handleSearchChange(event) {
        this.searchTerm = event.target.value;

        if (this.searchTerm.length > 2) {
            this.searchRecords();
        } else {
            this.records = [];
        }
    }

    // Perform search for records using Apex
    searchRecords() {
        this.isLoading = true;
        searchAccounts({ searchTerm: `%${this.searchTerm}%` })
            .then(result => {
                this.records = result;
                this.isLoading = false;
                this.isDropdownVisible = true;  // Show the dropdown with results
            })
            .catch(error => {
                this.isLoading = false;
                console.error(error);
            });
    }

    // Handle record selection
    handleRecordSelect(event) {
        const record = event.target.dataset.id;
        const recordName = event.target.dataset.record
        this.searchTerm = recordName;
        let jsonData = sessionStorage.getItem('orderFormData');
        jsonData = jsonData ? JSON.parse(jsonData) : {};
        jsonData.customerId = event.target.dataset.id;
        jsonData.customerName = event.target.dataset.name;
        sessionStorage.setItem('orderFormData',JSON.stringify(jsonData));
        this.accountId = event.target.dataset.id;
        this.enableNextButton = true;
        const recordIdEvent = new CustomEvent('recordevent',{ detail: { 'accountId': this.accountId,'showNextButton': this.enableNextButton,'fromCustomerTypeForm': true } });
        this.dispatchEvent(recordIdEvent);
    }

    // Close the dropdown if clicked outside
    handleClickOutside() {
        this.isDropdownVisible = false;
    }

    // Event listener for outside click
    connectedCallback() {
        const storedData = sessionStorage.getItem('orderFormData');

        if (storedData) {
            var parsedJson = JSON.parse(storedData);
            if (parsedJson.customerType == 'New Customer') {
                this.isRegisterCustomer = false;
                this.newCustomerVariant = 'brand';
                this.registerCustomerVariant = 'neutral';
                this.accountId = 'null';
                this.enableNextButton = true;
                const recordIdEvent = new CustomEvent('recordevent',{ detail: { 'accountId': this.accountId,'showNextButton': this.enableNextButton,'fromCustomerTypeForm': true } });
                this.dispatchEvent(recordIdEvent);
                
            }
            if (parsedJson?.customerName) {
                this.accountId = parsedJson.customerId;
                this.enableNextButton = true; // sumit
                const recordIdEvent = new CustomEvent('recordevent',{ detail: { 'accountId': this.accountId,'showNextButton': this.enableNextButton,'fromCustomerTypeForm': false } }); // sumit
                if (parsedJson.customerName) {
                    this.searchTerm = parsedJson.customerName; // sumit
                }
                this.dispatchEvent(recordIdEvent); // sumit
            }
        }
        document.addEventListener('click',this.handleClickOutside.bind(this));
    }

    // Remove event listener when component is removed from DOM
    disconnectedCallback() {
        let jsonData = sessionStorage.getItem('orderFormData');
        jsonData = jsonData ? JSON.parse(jsonData) : {};
        jsonData.customerId = this.accountId;
        jsonData.customerType = this.customerType;
        sessionStorage.setItem('orderFormData', JSON.stringify(jsonData));
        document.removeEventListener('click',this.handleClickOutside.bind(this));
    }
}