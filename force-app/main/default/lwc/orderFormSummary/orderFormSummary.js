import { LightningElement,track } from 'lwc';

export default class OrderFormSummary extends LightningElement {

    @track customer = {
        CompanyName: '',
        PO: '',
        FirstName: '',
        LastName: '',
        Email: '',
        Phone: '',
        Fax: '',
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
    };

    @track productData = [];

    @track document;

    @track productinfo;

    @track data = {
        subtotal: 1800.00,
        selectedShippingPrice: 12.00,
        estimatedTax: 30.00,
        discountAmount: 20.00,
        handlingFee: 0.00,
        totalPrice: 1822.00
    };

    connectedCallback() {
        // Retrieve JSON data from sessionStorage when the component reconnects
        const storedData = sessionStorage.getItem('orderFormData');
        if (storedData) {
            var parsedJson = JSON.parse(storedData);
            var customData = parsedJson.CustomerData;
            this.customer.CompanyName = customData.CompanyName;
            this.customer.PO = customData.PO;
            this.customer.FirstName = customData.FirstName;
            this.customer.LastName = customData.LastName;
            this.customer.Email = customData.Email;
            this.customer.Fax = customData.Fax;
            this.customer.Phone = customData.Phone;
            this.customer.ShippingAddress.Street = customData.ShippingAddress.Street;
            this.customer.ShippingAddress.City = customData.ShippingAddress.City;
            this.customer.ShippingAddress.State = customData.ShippingAddress.State;
            this.customer.ShippingAddress.ZipCode = customData.ShippingAddress.ZipCode;
            this.customer.BillingAddress.Street = customData.BillingAddress.Street;
            this.customer.BillingAddress.City = customData.BillingAddress.City;
            this.customer.BillingAddress.State = customData.BillingAddress.State;
            this.customer.BillingAddress.ZipCode = customData.BillingAddress.ZipCode;

            if (parsedJson?.totalOrderSummary) {
                this.data = JSON.parse(storedData).totalOrderSummary;
            }

            if (parsedJson?.productData) {
                this.productData = JSON.parse(storedData).productData;
            }

            if (parsedJson?.PriceData) {
                this.productinfo = JSON.parse(storedData).PriceData;
            }
            
            if (parsedJson?.documentation) {
                this.document = JSON.parse(storedData).documentation;
            }
        }

    }

    disconnectedCallback() {
        let jsonData = sessionStorage.getItem('orderFormData');
        jsonData = jsonData ? JSON.parse(jsonData) : {};
        jsonData.totalOrderSummary = this.data;
        jsonData.productData = this.productData;
        sessionStorage.setItem('orderFormData', JSON.stringify(jsonData));
    }
}