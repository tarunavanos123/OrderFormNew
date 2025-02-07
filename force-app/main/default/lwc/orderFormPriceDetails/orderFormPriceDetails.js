import { LightningElement, track, wire } from 'lwc';
import updateProductInfo from '@salesforce/apex/OrderForm.updateProductInfo';
import updateProductOption from '@salesforce/apex/OrderForm.updateProductOption';
import { ShowToastEvent } from 'lightning/platformShowToastEvent'; 

import fetchProduct from '@salesforce/apex/OrderForm.searchProducts';
import fetchProductOptions from '@salesforce/apex/OrderForm.fetchProductOptions';
import fetchSecondLevelProductOptions from '@salesforce/apex/OrderForm.fetchSecondLevelProductOptions';


export default class OrderFormPriceDetails extends LightningElement {

    @track initial_quantity = 0;
    @track productData = [];
    @track optionProductList = [];
    @track productOptionsUpdatedList = [];

    @track searchTerm = '';
    @track records = [];
    @track isDropdownVisible = false; // Controls visibility of the dropdown
    // @track isLoading = false;       // Loading indicator while fetching records


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
            { label: '0%', value: 0 },
            { label: '25%', value: 25 },
            { label: '50%', value: 50 },
            { label: '75%', value: 75 }
        ],
        selectedDiscountPercentage: 0,
        discountAmount: 0.0,
        handlingFee: 0.0,
        totalPrice: 0.0
    };

    @track selectedProduct = null; // Store selected product
    @track productOptionsList = []; // Store product options
    @track secondLevelProductOptionsList = [];
    @track isRequired = false; // Flag to check if product is required


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
        let length = this.productData.length + 1;
        let newRecord = { index: length.toString(), product_id: '', productName: '', quantity: 1, subtotal: 0, actualPrice: 50, discountPrice: 0 };

        this.productData = [...this.productData, newRecord];


        // console.log('isProductOptionsEmpty', JSON.stringify(this.productOptionsList));
        // console.log('isProductOptionsEmpty2', JSON.stringify(this.secondLevelProductOptionsList));



        const storedData = sessionStorage.getItem('orderFormData');
        if (storedData) {
            var parsedJson = JSON.parse(storedData);
            if (parsedJson?.PriceData) {
                this.data = JSON.parse(storedData).PriceData;
            }
            if (parsedJson?.productData) {
                this.productData = JSON.parse(storedData).productData;
                console.log('productData', JSON.stringify(this.productData));
                console.log('productName', JSON.stringify(this.productData[0].productName));

                this.searchTerm = this.productData[0].productName;
            }


            if (parsedJson?.productOptionsUpdatedList) {
                console.log('optionProductList');

                this.productOptionsList = JSON.parse(storedData).productOptionsUpdatedList;
                this.productOptionsUpdatedList = JSON.parse(storedData).productOptionsUpdatedList;

                console.log('abc ', JSON.stringify(this.productOptionsUpdatedList));

            }
        }
        this.calculateTotalPrice();

        let productValidation = false;
        console.log('productData', this.productData);
        console.log('productData 0', this.productData[0].product_id != '');

        if (this.productData.length > 0 && this.productData[0].product_id != '') {
            productValidation = true;
        }
        this.dispatchEvent(
            new CustomEvent('productvalidation', {
                detail: { productValidation }
            })
        );

        const staticStepStatus = {
            step1: true,
            step2: true,
            step3: false,
            step4: false,
            step5: false
        };
        const stepUpdateEvent = new CustomEvent('stepupdate', {
            detail: { staticStepStatus }
        });

        this.dispatchEvent(stepUpdateEvent);
        document.addEventListener('click', this.handleClickOutside.bind(this));

    }

    renderedCallback() {

        this.productData.map(product => {
            let firstIndex = product.productOptionsList && product.productOptionsList.length > 0;
            let secondIndex = product.secondLevelProductOptionsList && product.secondLevelProductOptionsList > 0;

            console.log('firstIndex', firstIndex);
            console.log('secondIndex', secondIndex);

            if (firstIndex) {
                console.log(product.index);
                const element = this.template.querySelector('[data-firstoption="' + product.index + '"]');
                console.log('element', element);
                if (element) {
                    element.classList.remove('slds-hide');
                }
            }
            else if (secondIndex) {
                const element = this.template.querySelector('[data-secondoption="' + product.index + '"]');
                if (element) {
                    element.classList.remove('slds-hide');
                }
            }
        });

    }

    disconnectedCallback() {
        let jsonData = sessionStorage.getItem('orderFormData');
        jsonData = jsonData ? JSON.parse(jsonData) : {};

        jsonData.PriceData = this.data;
        jsonData.productData = this.productData;
        jsonData.productOptionsUpdatedList = this.productOptionsUpdatedList;



        this.productOptionsUpdatedList = this.productOptionsUpdatedList.reduce((acc, record) => {
            if (record.array) {
                // Add the nested array items to the main array
                acc = acc.concat(record.array);
            }
            // Add the original record without the array
            const { array, ...rest } = record; // Remove the nested array
            acc.push(rest);
            return acc;
        }, []);

        console.log('dis..', JSON.stringify(this.productOptionsUpdatedList));
        jsonData.productOptionsUpdatedList = this.productOptionsUpdatedList;


        updateProductOption({ productDetails: `${JSON.stringify(this.productOptionsUpdatedList)}`, orderFormId: `${jsonData.orderFormId}`, })
            .then(result => {
                this.records = result;
                console.log('optionProductApex');

                sessionStorage.setItem('orderFormData', JSON.stringify(jsonData));


            })
            .catch(error => {
                // jsonData.productOptionsUpdatedList = '';
                console.error(error);
            });


        updateProductInfo({ productDetails: `${JSON.stringify(this.productData)}`, orderFormId: `${jsonData.orderFormId}`, })
            .then(result => {
                this.records = result;
                console.log('updateProductInfoApex');

                sessionStorage.setItem('orderFormData', JSON.stringify(jsonData));

            })
            .catch(error => {
                console.error(error);
            });

        sessionStorage.setItem('orderFormData', JSON.stringify(jsonData));
        document.removeEventListener('click', this.handleClickOutside.bind(this));

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
        var duplicateError=false;

        
        for (var i=0; i< this.productData.length; i++){
            if(this.productData[i].product_id == event.currentTarget.dataset.value && this.productData[i].index !== event.currentTarget.dataset.index){
                duplicateError = true;
            }
        }

        if (duplicateError) {
            var a =  this.template.querySelector(".search-input[data-pid='"+event.currentTarget.dataset.index+"']");
            console.log( a);

            this.template.querySelector(".search-input[data-pid='"+event.currentTarget.dataset.index+"']").value = "";
            const toastEvent = new ShowToastEvent({
                title: 'Duplicate Product',
                message: 'This Product is already choosed. Please select another product.',
                variant: 'error', // Set to 'error' for an error toast    
                mode: 'dismissable', // Allows user to dismiss the toast
                duration: 2500 // Duration in milliseconds (2.5 seconds)
            });
            this.dispatchEvent(toastEvent);
        }else{
            this.searchTerm = event.currentTarget.dataset.record;

            let productValidation = true;
            this.dispatchEvent(
                new CustomEvent('productvalidation', {
                    detail: { productValidation }
                })
            );
            
            var index = event.currentTarget.dataset.index;

            const newValue = event.currentTarget.dataset.record;
            this.productData[Number(index) - 1].productName = null;
            setTimeout(() => {
                this.productData[Number(index) - 1].productName = newValue;
              }, 0);
            //   this.productData[Number(index) - 1].productName = event.currentTarget.dataset.record;

            this.productData[Number(index) - 1].product_id = event.currentTarget.dataset.value;
            this.data.productCount = parseInt(this.productData[Number(index) - 1].quantity, 10);
            this.productData[Number(index) - 1].subtotal = parseInt(this.productData[Number(index) - 1].actualPrice, 10) * parseInt(this.productData[Number(index) - 1].quantity, 10);
            this.updateQtyAndPrice(this.productData);

            const selectedProductId = event.currentTarget.dataset.value;
            this.selectedProduct = selectedProductId;

            // Find if the selected product is required
            const selectedProduct = this.accountOptions.find(p => p.value === selectedProductId);
            this.isRequired = selectedProduct ? selectedProduct.isRequired : false;

            console.log('main..', selectedProductId);


            fetchProductOptions({ productId: selectedProductId })
                .then((data) => {
                    if(data.length != 0) {
                        this.productOptionsList = data.map(option => ({
                            id: option.Id,
                            name: option.Name,
                            sku: option.SBQQ__OptionalSKU__c,
                            selected: option.SBQQ__Selected__c ? option.SBQQ__Selected__c : option.SBQQ__Required__c, // Pre-select if required
                            disabled: option.SBQQ__Required__c // Disable if required
                        }));
                    
                    console.log('indexxxxxxxxx00000', index);

                    const element = this.template.querySelector('[data-firstoption="' + index + '"]');

                    console.log('data-firstption', element);


                    if (this.productOptionsList && this.productOptionsList.length > 0) {
                        if (element) {
                            element.classList.remove('slds-hide');
                        }
                    }
                    else {
                        if (element) {
                            element.classList.add('slds-hide');
                        }
                    }

                    this.productData[Number(index) - 1].productOptionsList = this.productOptionsList;

                    console.log('prodyctData',);


                    console.log('productOptionsList', JSON.stringify(this.productOptionsList));
                    // this.productOptionsUpdatedList = this.productOptionsList.filter(record => record.selected === true || record.disabled === true);
                    this.productOptionsUpdatedList = this.productOptionsList;

                    console.log('productOptionsUpdatedList', JSON.stringify(this.productOptionsUpdatedList));

                })
                .catch(error => {
                    console.error('Error fetching product options:', error);
                });

        }
    }

    handleOptionChange(event) {
        const optionId = event.target.dataset.id;
        const isChecked = event.target.checked;
        const name = event.target.dataset.name;
        const sku = event.target.dataset.sku;
        const index = event.target.dataset.index;

        if (isChecked) {
            this.productOptionsUpdatedList.forEach((item) => {
                if (item.id === optionId) {
                    item.selected = true;
                }
            });

            fetchSecondLevelProductOptions({ productId: optionId })
                .then((data) => {
                    this.secondLevelProductOptionsList = data.map(option => ({
                        id: option.Id,
                        name: option.Name,
                        sku: option.SBQQ__OptionalSKU__c,
                        selected: true

                    }));

                    this.productData[Number(index) - 1].secondLevelProductOptionsList = this.secondLevelProductOptionsList;

                    console.log('secondLevelProductOptionsList', JSON.stringify(this.secondLevelProductOptionsList));
                    if (this.secondLevelProductOptionsList && this.secondLevelProductOptionsList.length > 0) {
                        const array = this.secondLevelProductOptionsList;
                        this.productOptionsUpdatedList = this.productOptionsUpdatedList.map(record =>
                            record.id === optionId
                                ? { ...record, array }
                                : record
                        );
                        const element = this.template.querySelector('[data-secondoption="' + index + '"]');

                        console.log('data-secondoption', element);

                        if (element) {
                            element.classList.remove('slds-hide');
                        }
                    }

                    console.log('productOptionsUpdatedList1', JSON.stringify(this.productOptionsUpdatedList));


                })
                .catch(error => {
                    console.error('Error fetching product options:', error);
                });
        } else {
            console.log('else11..', JSON.stringify(this.productOptionsUpdatedList));

            this.productOptionsUpdatedList.forEach((item) => {
                if (item.id === optionId) {
                    item.selected = false;
                }
            });
            // this.productOptionsUpdatedList = this.productOptionsUpdatedList.filter(record => record.id !== optionId);
            console.log('else..', JSON.stringify(this.productOptionsUpdatedList));

        }




        // Update the selected state of the option
        // this.productOptionsList = this.productOptionsList.map(option =>
        //     option.id === optionId ? { ...option, selected: isChecked } : option
        // );
    }

    get isProductOptionsEmpty() {
        return this.productOptionsList.length === 0;
    }

    get isProductOptionsEmpty2() {
        return this.secondLevelProductOptionsList.length === 0;
    }

    handleQtyChange(event) {


        const min = parseInt(event.target.min, 10);
        let value = parseInt(event.target.value, 10);

        if (!value || isNaN(value)) {
            event.target.value = 0;
        } else if (value < min) {
            event.target.value = min;
        } else {
            event.target.value = value;
        }

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

    // @wire(fetchProduct)
    // wiredAccounts({ error, data }) {
    //     if (data) {
    //         this.accountOptions = data.map(account => ({
    //             label: account.Name,
    //             value: account.Id,
    //             isRequired: account.SBQQ__ConfigurationType__c == "Required"
    //         }));
    //     } else if (error) {
    //         console.error('Error fetching accounts:', error);
    //     }
    // }

    handleSearchChange(event) {
        this.searchTerm = event.target.value;
        const id = event.target.dataset.pid;
        console.log('id', id);




        if (this.searchTerm.length > 2) {
            this.searchRecords(id);
        } else {
            this.records = [];
        }
    }

    searchRecords(id) {
        // this.isLoading = true;
        fetchProduct({ searchTerm: `%${this.searchTerm}%` })
            .then(result => {
                this.records = result;

                // this.isLoading = false;
                this.isDropdownVisible = true;
                console.log('idd', id);

                // const element = this.template.querySelector('#' + id);
                const element = this.template.querySelector('[data-pidd="' + id + '"]');

                console.log('element', element);

                if (element) {
                    element.classList.remove('slds-hide');

                }
            })
            .catch(error => {
                // this.isLoading = false;
                console.error(error);
            });
    }


    handleClickOutside() {
        this.isDropdownVisible = false;
        const elements = this.template.querySelectorAll('.search-input.dropdown');
        console.log('Selected Elements:', elements);

        elements.forEach(element => {
            element.classList.add('slds-hide');
        });
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