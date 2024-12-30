import { LightningElement, track, wire } from 'lwc';
import updateProductInfo from '@salesforce/apex/OrderForm.updateProductInfo';
import fetchProduct from '@salesforce/apex/OrderForm.fetchProduct';

export default class OrderFormPriceDetails extends LightningElement {

    @track initial_quantity = 0;
    @track productData = [];


    @track data = {
        productCount: 0,
        subtotal: 0,
        totalWeight: 0,
        totalProduct: 0,
        shippingMethods: [
            { method: 'RG - Ground', description: 'RG - Ground has a 5-7 business day ETA.', price: 15.88 },
            { method: 'Express', description: 'Express shipping delivers within 2-3 business days.', price: 30.00 },
            { method: 'Overnight', description: 'Overnight shipping guarantees delivery by the next business day.', price: 50.00 }
        ],
        selectedShippingMethod: 'RG - Ground',
        shippingDescription: 'RG - Ground has a 5-7 business day ETA.',
        selectedShippingPrice: 0,
        salesTaxRate: 0.0,
        estimatedTax: 0.0,
        discountOptions: [
            { label: '25%', value: 25 },
            { label: '50%', value: 50 },
            { label: '75%', value: 75 }
        ],
        selectedDiscountPercentage: 0,
        discountAmount: 0.0,
        handlingFee: 0.0,
        totalPrice: 0.0
    };


    get shippingOptions() {
        return this.data.shippingMethods.map((method) => ({
            label: method.method,
            value: method.method
        }));
    }

    get discountOptions() {
        return this.data.discountOptions.map((discount) => ({
            label: `${discount}%`,
            value: discount
        }));
    }

    connectedCallback() {
        // Retrieve JSON data from sessionStorage when the component reconnects

        const storedData = sessionStorage.getItem('orderFormData');
        if (storedData) {
            var parsedJson = JSON.parse(storedData);
            if (parsedJson?.PriceData) {
                this.data = JSON.parse(storedData).PriceData;
            }
            if (parsedJson?.productData) {
                this.productData = JSON.parse(storedData).productData;
            }
        }
        this.calculateTotalPrice();

        let productValidation = false;
        if (this.productData.length > 0) {
            productValidation = true;
        }
        this.dispatchEvent(
            new CustomEvent('productvalidation', {
                detail: { productValidation }
            })
        );

    }

    disconnectedCallback() {
        let jsonData = sessionStorage.getItem('orderFormData');
        jsonData = jsonData ? JSON.parse(jsonData) : {};

        jsonData.PriceData = this.data;
        jsonData.productData = this.productData;

        updateProductInfo({ productDetails: `${JSON.stringify(this.productData)}`, orderFormId: `${jsonData.orderFormId}`, })
            .then(result => {
                this.records = result;
                sessionStorage.setItem('orderFormData', JSON.stringify(jsonData));

            })
            .catch(error => {
                console.error(error);
            });

        sessionStorage.setItem('orderFormData', JSON.stringify(jsonData));

    }



    handleShippingChange(event) {
        const selectedMethod = event.detail.value;
        const shippingMethod = this.data.shippingMethods.find((method) => method.method === selectedMethod);
        this.data.selectedShippingMethod = shippingMethod.method;
        this.data.shippingDescription = shippingMethod.description;
        this.data.selectedShippingPrice = shippingMethod.price;
        this.calculateTotalPrice();
    }

    handleTaxChange(event) {
        this.data.salesTaxRate = parseFloat(event.target.value);
        this.data.estimatedTax = (this.data.subtotal * this.data.salesTaxRate) / 100;
        this.calculateTotalPrice();
    }

    handleDiscountChange(event) {
        this.data.selectedDiscountPercentage = parseFloat(event.detail.value);
        this.data.discountAmount = (this.data.subtotal * this.data.selectedDiscountPercentage) / 100;
        this.calculateTotalPrice();
    }

    calculateTotalPrice() {
        this.data.totalPrice =
            this.data.subtotal +
            this.data.selectedShippingPrice +
            this.data.estimatedTax -
            this.data.discountAmount +
            this.data.handlingFee;
    }

    handleChange(event) {
        let productValidation = true;
        this.dispatchEvent(
            new CustomEvent('productvalidation', {
                detail: { productValidation }
            })
        );
        var index = event.target.dataset.index;
        this.productData[Number(index) - 1].product_id = event.target.value;
        this.data.productCount = parseInt(this.productData[Number(index) - 1].quantity, 10);
        this.productData[Number(index) - 1].subtotal = parseInt(this.productData[Number(index) - 1].actualPrice, 10) * parseInt(this.productData[Number(index) - 1].quantity, 10);
        this.updateQtyAndPrice(this.productData);
    }

    handleQtyChange(event) {

        var index = event.target.dataset.index;

        this.productData[Number(index) - 1].quantity = event.target.value;
        this.data.productCount = parseInt(this.productData[Number(index) - 1].quantity, 10);
        this.productData[Number(index) - 1].subtotal = parseInt(this.productData[Number(index) - 1].actualPrice, 10) * parseInt(this.productData[Number(index) - 1].quantity, 10);
        this.updateQtyAndPrice(this.productData);

    }

    updateQtyAndPrice(products) {
        var totalQuantity = 0;
        var subTotal = 0;
        products.forEach(product => {
            totalQuantity += parseInt(product.quantity, 10);
            subTotal += parseInt(product.subtotal, 10);
        });

        this.data.productCount = totalQuantity;
        this.data.subtotal = subTotal;
        this.data.totalProduct = products.length;
        this.calculateTotalPrice();

    }


    @track accountOptions = []; // To store the combobox options

    @wire(fetchProduct)
    wiredAccounts({ error, data }) {
        if (data) {
            this.accountOptions = data.map(account => ({
                label: account.Name,
                value: account.Id
            }));
        } else if (error) {
            console.error('Error fetching accounts:', error);
        }
    }




    get productQuantity() {
        return [
            { label: '1', value: 1 },
            { label: '2', value: 2 },
            { label: '3', value: 3 },
        ];
    }

    addProduct() {

        let length = this.productData.length + 1;
        let newRecord = { index: length.toString(), product_id: '', productName: '', quantity: 1, subtotal: 0, actualPrice: 50, discountPrice: 0 };

        this.productData = [...this.productData, newRecord];

    }

    handleCross(event) {
        const indexValue = event.target.dataset.index;
        const productId = event.target.dataset.id;


        this.productData = this.productData
            .filter(item => item.index !== indexValue)
            .map((item, index) => ({ ...item, index: (index + 1).toString() }));
        this.updateQtyAndPrice(this.productData);

        let productValidation = false;
        if (this.productData.length > 0) {
            productValidation = true;
        }
        this.dispatchEvent(
            new CustomEvent('productvalidation', {
                detail: { productValidation }
            })
        );


    }
}