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
    };

    @track productOptionsUpdatedList = [];

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
            // var productOptionsUpdatedList = parsedJson.productOptionsUpdatedList;
            console.log('productOptionsUpdatedList', JSON.parse(storedData).productOptionsUpdatedList);
            
            var customData = parsedJson.CustomerData;
            this.customer.CompanyName = customData.CompanyName;
            this.customer.PO = customData.PO;
            this.customer.FirstName = customData.FirstName;
            this.customer.LastName = customData.LastName;
            this.customer.Email = customData.Email;
            this.customer.Fax = customData.Fax;
            this.customer.Phone = customData.Phone;
            this.customer.ShippingAddress.shippingStreet = customData.ShippingAddress.shippingStreet;
            this.customer.ShippingAddress.shippingCity = customData.ShippingAddress.shippingCity;
            this.customer.ShippingAddress.shippingState = customData.ShippingAddress.shippingState;
            this.customer.ShippingAddress.shippingZipCode = customData.ShippingAddress.shippingZipCode;
            this.customer.BillingAddress.billingStreet = customData.BillingAddress.billingStreet;
            this.customer.BillingAddress.billingCity = customData.BillingAddress.billingCity;
            this.customer.BillingAddress.billingState = customData.BillingAddress.billingState;
            this.customer.BillingAddress.billingZipCode = customData.BillingAddress.billingZipCode;

            if (parsedJson?.totalOrderSummary) {
                this.data = JSON.parse(storedData).totalOrderSummary;
            }

            if (parsedJson?.productData) {
                this.productData = JSON.parse(storedData).productData;
            }

            if (parsedJson?.PriceData) {
                this.productinfo = JSON.parse(storedData).PriceData;
            }

            if (parsedJson?.productOptionsUpdatedList) {
                this.productOptionsUpdatedList = JSON.parse(storedData).productOptionsUpdatedList;
            }
            
            if (parsedJson?.documentation) {
                this.document = JSON.parse(storedData).documentation;
            }
        }

        const staticStepStatus = {
            step1: true,
            step2: true,
            step3: true,
            step4: true,
            step5: false
        };
        const stepUpdateEvent = new CustomEvent('stepupdate', {
            detail: { staticStepStatus }
        });

        this.dispatchEvent(stepUpdateEvent);

    }


    get isProductOptionsUpdatedList() {
        return this.productOptionsUpdatedList.length === 0;
    }

    disconnectedCallback() {
        let jsonData = sessionStorage.getItem('orderFormData');
        jsonData = jsonData ? JSON.parse(jsonData) : {};
        jsonData.totalOrderSummary = this.data;
        jsonData.productData = this.productData;
        sessionStorage.setItem('orderFormData', JSON.stringify(jsonData));
    }
}