import { LightningElement, track, wire } from 'lwc';
import updateProductInfo from '@salesforce/apex/OrderForm.updateProductInfo';
import updateProductOption from '@salesforce/apex/OrderForm.updateProductOption';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

import fetchProduct from '@salesforce/apex/OrderForm.searchProducts';
import fetchProductOptions from '@salesforce/apex/OrderForm.fetchProductOptions';
import fetchSecondLevelProductOptions from '@salesforce/apex/OrderForm.fetchSecondLevelProductOptions';
import fetchRelatedProduct from '@salesforce/apex/OrderForm.fetchRelatedProduct';



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
            { method: 'RG - Ground',description: 'RG - Ground has a 5-7 business day ETA.',price: 15.88 },
            { method: 'Express',description: 'Express shipping delivers within 2-3 business days.',price: 30.00 },
            { method: 'Overnight',description: 'Overnight shipping guarantees delivery by the next business day.',price: 50.00 }
        ],
        selectedShippingMethod: 'RG - Ground',
        shippingDescription: 'RG - Ground has a 5-7 business day ETA.',
        selectedShippingPrice: 0,
        salesTaxRate: 0.0,
        estimatedTax: 0.0,
        discountOptions: [],
        selectedDiscountPercentage: 0,
        discountAmount: 0.0,
        handlingFee: 0.0,
        totalPrice: 0.0,

        generateDiscountOptions(n) {
            this.discountOptions = [];
            for (let i = 0; i <= n; i += 1) {
                this.discountOptions.push({ label: `${i}%`,value: i });
            }
        }
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
        this.data.generateDiscountOptions(55);
        let length = this.productData.length + 1;
        let newRecord = { index: length.toString(),product_id: '',productName: '',quantity: 1,subtotal: 0,actualPrice: 50,discountPrice: 0 };
        this.productData = [...this.productData,newRecord];
        const storedData = sessionStorage.getItem('orderFormData');
        if (storedData) {
            var parsedJson = JSON.parse(storedData);
            if (parsedJson?.PriceData) {
                this.data = JSON.parse(storedData).PriceData;
            }
            if (parsedJson?.productData) {
                this.productData = JSON.parse(storedData).productData;
                console.log('productData',JSON.stringify(this.productData));
                // console.log('productName', JSON.stringify(this.productData[0].productName));

                if (this.productData[0] && this.productData[0].productName) {
                    this.searchTerm = this.productData[0].productName;

                }
            }

            if (parsedJson?.productOptionsUpdatedList) {
                this.productOptionsList = JSON.parse(storedData).productOptionsUpdatedList;
                this.productOptionsUpdatedList = JSON.parse(storedData).productOptionsUpdatedList;
            }
        }

        this.calculateTotalPrice();
        let productValidation = false;

        if (this.productData.length > 0 && this.productData[0] && this.productData[0].product_id != '') {
            productValidation = true;
        }

        this.dispatchEvent(
            new CustomEvent('productvalidation',{
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
        const stepUpdateEvent = new CustomEvent('stepupdate',{
            detail: { staticStepStatus }
        });

        this.dispatchEvent(stepUpdateEvent);
        document.addEventListener('click',this.handleClickOutside.bind(this));

    }

    renderedCallback() {

        this.productData.map(product => {
            let firstIndex = product.productOptionsList && product.productOptionsList.length > 0;
            let secondIndex = product.secondLevelProductOptionsList && product.secondLevelProductOptionsList > 0;

            if (firstIndex) {

                const element = this.template.querySelector('[data-firstoption="' + product.index + '"]');

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

        var productOptionArr = [];

        this.productData.forEach(product => {
            if (product.productOptionsList && product.productOptionsList.length > 0) {
                product.productOptionsList.forEach(productOption => {
                    productOptionArr.push(productOption);
                })
            }
            if (product.secondLevelProductOptionsList && product.secondLevelProductOptionsList.length > 0) {
                product.secondLevelProductOptionsList.forEach(productOption => {
                    productOptionArr.push(productOption);
                })
            }
        })

        updateProductOption({ productDetails: `${JSON.stringify(productOptionArr)}`,orderFormId: `${jsonData.orderFormId}`,})
            .then(result => {
                this.records = result;
                sessionStorage.setItem('orderFormData',JSON.stringify(jsonData));
            })
            .catch(error => {
                console.error(error);
            });


        updateProductInfo({ productDetails: `${JSON.stringify(this.productData)}`,orderFormId: `${jsonData.orderFormId}`,})
            .then(result => {
                this.records = result;
                sessionStorage.setItem('orderFormData',JSON.stringify(jsonData));
            })
            .catch(error => {
                console.error(error);
            });

        sessionStorage.setItem('orderFormData',JSON.stringify(jsonData));
        document.removeEventListener('click',this.handleClickOutside.bind(this));
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
        var duplicateError = false;

        for (var i = 0; i < this.productData.length; i++) {
            if ((this.productData[i].product_id == event.currentTarget.dataset.value && !this.productData[i].productOptionsList) && this.productData[i].index !== event.currentTarget.dataset.index) {
                duplicateError = true;
            }
        }

        if (duplicateError) {

            this.template.querySelector(".search-input[data-pid='" + event.currentTarget.dataset.index + "']").value = "";

            delete this.productData[Number(event.currentTarget.dataset.index) - 1].productOptionsList;
            delete this.productData[Number(event.currentTarget.dataset.index) - 1].secondLevelProductOptionsList;

            const toastEvent = new ShowToastEvent({
                title: 'Duplicate Product',
                message: 'This Product is already choosed. Please select another product.',
                variant: 'error', // Set to 'error' for an error toast    
                mode: 'dismissable', // Allows user to dismiss the toast
                duration: 2500 // Duration in milliseconds (2.5 seconds)
            });
            this.dispatchEvent(toastEvent);
        } else {
            this.searchTerm = event.currentTarget.dataset.record;

            let productValidation = true;

            const quantityInputs = this.template.querySelectorAll('.quantity');

            quantityInputs.forEach(input => {
                if (input.value == 0) {
                    productValidation = false;
                }
            });


            this.dispatchEvent(
                new CustomEvent('productvalidation',{
                    detail: { productValidation }
                })
            );

            var index = event.currentTarget.dataset.index;
            const newValue = event.currentTarget.dataset.record;
            this.productData[Number(index) - 1].productName = null;
            setTimeout(() => {
                this.productData[Number(index) - 1].productName = newValue;
            },0);

            this.productData[Number(index) - 1].product_id = event.currentTarget.dataset.value;
            this.data.productCount = parseInt(this.productData[Number(index) - 1].quantity,10);
            this.productData[Number(index) - 1].subtotal = parseInt(this.productData[Number(index) - 1].actualPrice,10) * parseInt(this.productData[Number(index) - 1].quantity,10);
            this.updateQtyAndPrice(this.productData);

            const selectedProductId = event.currentTarget.dataset.value;
            this.selectedProduct = selectedProductId;

            // Find if the selected product is required
            const selectedProduct = this.accountOptions.find(p => p.value === selectedProductId);
            this.isRequired = selectedProduct ? selectedProduct.isRequired : false;

            fetchProductOptions({ productId: selectedProductId })
                .then((data) => {
                    console.log('fetchProductOptions',JSON.stringify(data));
                    if (data.length != 0) {
                        this.productOptionsList = data.map(option => ({
                            id: option.Id,
                            name: option.Name,
                            sku: option.SBQQ__OptionalSKU__c,
                            master_product: option.SBQQ__ConfiguredSKU__c,
                            product_name: option.SBQQ__ProductName__c,
                            master_product_name: option.SBQQ__ConfiguredSKU__r.Name,
                            selected: option.SBQQ__Selected__c ? option.SBQQ__Selected__c : option.SBQQ__Required__c, // Pre-select if required
                            disabled: option.SBQQ__Required__c // Disable if required
                        }));


                        const element = this.template.querySelector('[data-firstoption="' + index + '"]');

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
                        this.productOptionsUpdatedList = this.productOptionsList;

                        let jsonData = sessionStorage.getItem('orderFormData');
                        jsonData = jsonData ? JSON.parse(jsonData) : {};

                        fetchRelatedProduct({ productDetails: `${JSON.stringify(this.productOptionsUpdatedList)}`,orderFormId: `${jsonData.orderFormId}`,})
                            .then(result => {
                                this.records = result;
                                var secondlevelresult = result.map(option => ({
                                    id: option.Id,
                                    name: option.Name,
                                    sku: option.SBQQ__OptionalSKU__c,
                                    master_product: option.SBQQ__ConfiguredSKU__c,
                                    product_name: option.SBQQ__ProductName__c,
                                    master_product_name: option.SBQQ__ConfiguredSKU__r.Name,
                                    selected: option.SBQQ__Selected__c ? option.SBQQ__Selected__c : option.SBQQ__Required__c, // Pre-select if required
                                    disabled: option.SBQQ__Required__c // Disable if required
                                }));

                                this.productData[Number(index) - 1].secondLevelProductOptionsList = secondlevelresult;
                            })
                            .catch(error => {
                                console.error(error);
                            });
                    }
                    else {
                        const element = this.template.querySelector('[data-firstoption="' + index + '"]');

                        delete this.productData[Number(index) - 1].productOptionsList;
                        delete this.productData[Number(index) - 1].secondLevelProductOptionsList;
                    }
                })
                .catch(error => {
                    console.error('Error fetching product options:',error);
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

            this.productData.forEach((item) => {
                if (item.product_id === sku) {
                    item.productOptionsList.forEach((element) => {
                        if (element.id === optionId) {
                            element.selected = true;
                        }
                    })
                }
            });

            fetchSecondLevelProductOptions({ productId: optionId })
                .then((data) => {
                    this.secondLevelProductOptionsList = data.map(option => ({
                        Id: option.Id,
                        Name: option.Name,
                        sku: option.SBQQ__OptionalSKU__c,
                        product_name:option.SBQQ__ProductName__c,
                        master_product_name: option.SBQQ__ConfiguredSKU__r.Name,
                        parentProduct:this.productData[Number(index) - 1].productName,
                        isParentProduct : this.productData[Number(index) - 1].productName != '' ? true : false,
                        selected: true

                    }));

                    this.productData[Number(index) - 1].secondLevelProductOptionsList = this.secondLevelProductOptionsList;

                    if (this.secondLevelProductOptionsList && this.secondLevelProductOptionsList.length > 0) {
                        const array = this.secondLevelProductOptionsList;
                        this.productOptionsUpdatedList = this.productOptionsUpdatedList.map(record =>
                            record.id === optionId
                                ? { ...record,array }
                                : record
                        );
                        const element = this.template.querySelector('[data-secondoption="' + index + '"]');

                        if (element) {
                            element.classList.remove('slds-hide');
                        }
                    }

                })
                .catch(error => {
                    console.error('Error fetching product options:',error);
                });
        } else {
            this.productData.forEach((item) => {
                if (item.product_id === sku) {
                    item.productOptionsList.forEach((element) => {
                        if (element.id === optionId) {
                            element.selected = false;
                        }
                    })
                }
            });

            this.productOptionsUpdatedList.forEach((item) => {
                if (item.id === optionId) {
                    item.selected = false;
                }
            });

            const element = this.template.querySelector('[data-secondoption="' + index + '"]');

            if (element) {
                element.classList.add('slds-hide');
            }
        }
    }

    get isProductOptionsEmpty() {
        return this.productOptionsList.length === 0;
    }

    get isProductOptionsEmpty2() {
        return this.secondLevelProductOptionsList.length === 0;
    }

    handleQtyChange(event) {
        const min = parseInt(event.target.min,10);
        let value = parseInt(event.target.value,10);

        if (!value || isNaN(value)) {
            event.target.value = 0;
        } else if (value < min) {
            event.target.value = min;
        } else {
            event.target.value = value;
        }

        var index = event.target.dataset.index;
        let productValidation = true;
        
        const quantityInputs = this.template.querySelectorAll('.quantity');

        quantityInputs.forEach(input => {
            if (input.value == 0) {
                productValidation = false;
            }
        });

        this.dispatchEvent(
            new CustomEvent('productvalidation', {
                detail: { productValidation }
            })
        );

        this.productData[Number(index) - 1].quantity = event.target.value;
        this.data.productCount = parseInt(this.productData[Number(index) - 1].quantity,10);
        this.productData[Number(index) - 1].subtotal = parseInt(this.productData[Number(index) - 1].actualPrice,10) * parseInt(this.productData[Number(index) - 1].quantity,10);
        this.updateQtyAndPrice(this.productData);

    }

    updateQtyAndPrice(products) {
        var totalQuantity = 0;
        var subTotal = 0;
        products.forEach(product => {
            totalQuantity += parseInt(product.quantity,10);
            subTotal += parseInt(product.subtotal,10);
        });

        this.data.productCount = totalQuantity;
        this.data.subtotal = subTotal;
        this.data.totalProduct = products.length;
        this.calculateTotalPrice();

    }

    @track accountOptions = []; // To store the combobox options

    handleSearchChange(event) {

        if (event.target.value == "" || event.target.value == null) {
            var index = event.currentTarget.dataset.pid;
            this.productData[Number(index) - 1].quantity = 1;
        }else{

        this.searchTerm = event.target.value;
        const id = event.target.dataset.pid;

        if (this.searchTerm.length > 2) {
            this.searchRecords(id);
        } else {
            this.records = [];
        }
    }
    }

    searchRecords(id) {
        fetchProduct({ searchTerm: `%${this.searchTerm}%` })
            .then(result => {
                this.records = result;
                this.isDropdownVisible = true;
                const element = this.template.querySelector('[data-pidd="' + id + '"]');

                if (element) {
                    element.classList.remove('slds-hide');
                }
            })
            .catch(error => {
                console.error(error);
            });
    }

    handleClickOutside() {
        this.isDropdownVisible = false;
        const elements = this.template.querySelectorAll('.search-input.dropdown');

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

        let productValidation = false;
        this.dispatchEvent(
            new CustomEvent('productvalidation',{
                detail: { productValidation }
            })
        );
    }

    handleCross(event) {
        const indexValue = event.target.dataset.index;


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