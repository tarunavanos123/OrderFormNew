import { LightningElement,track,wire } from 'lwc';
import getOrderFormsByOwner from '@salesforce/apex/OrderForm.getOrderFormsByOwner';
import getOrderForms from '@salesforce/apex/OrderForm.getOrderForms';
import fetchProductOptions from '@salesforce/apex/OrderForm.fetchProductOptions';
import NoHeader from '@salesforce/resourceUrl/NoHeader';
import { loadStyle,loadScript } from 'lightning/platformResourceLoader';
import Id from '@salesforce/user/Id';
import resendMail from '@salesforce/apex/EmailManager.resendMail';


const columns = [
    {
        label: 'Order ID',fieldName: 'orderId',type: 'button', // Makes it clickable
        typeAttributes: {
            label: { fieldName: 'orderId' },
            variant: 'base'
        }
    },
    { label: 'Company',fieldName: 'companyName' },
    { label: 'First Name',fieldName: 'firstName' },
    { label: 'Last Name',fieldName: 'lastName' },
    { label: 'Email',fieldName: 'emailId' },
    { label: 'Phone',fieldName: 'phone' },
    { label: 'Status',fieldName: 'status' }
];

export default class OrderFormHistory extends LightningElement {
    data = [];
    columns = columns;

    @track productData = [];
    @track productOptionsList = [];
    @track productOptionsUpdatedList = [];

    @track orderHistoryPage = true;
    @track orderDetailPage = false;
    @track isReadOnly = false;


    @track displayedRecords = [];
    @track currentPage = 1;
    @track pageSize = 10;
    @track orderHistoryData = [];
    searchTerm = '';

    totalRecords;
    first = true;
    after = '';
    lastId = '';
    before = '';
    firstId = '';
    last = false;
    lastPageSize = 0;
    @track records;


    @track customer = {
        orderFormID: '',
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

    @track priceData = {
        productCount: 2,
        subtotal: 50,
        totalWeight: 0,
        totalProduct: 50,
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
        discountOptions: [
            { label: '25%',value: 25 },
            { label: '50%',value: 50 },
            { label: '75%',value: 75 }
        ],
        selectedDiscountPercentage: 0,
        discountAmount: 0.0,
        handlingFee: 0.0,
        totalPrice: 0.0
    };

    @wire(getOrderFormsByOwner,{ ownID: `${Id}` })
    wiredOrderFormHistory({ error,data }) {
        if (data) {
            this.orderHistoryData = data;
            this.filteredData = data;
            this.currentPage = 1;
            this.records = data
            this.updateDisplayedRecords();
        } else if (error) {
            console.error('Error retrieving order history:',error);
        }
    }

    get totalPages() {
        if (this.filteredData) {
            return Math.ceil(this.filteredData.length / this.pageSize);
        }
    }

    get showBar() {
        return this.totalPages > 1;
    }

    handleFirst() {
        this.currentPage = 1;
        this.resetFields();
        this.refreshButtons();
        this.updateDisplayedRecords();
    }

    handleNextPagination() {
        this.currentPage++;
        this.resetFields();
        var lastRecord = this.records[this.records.length - 1];
        this.after = lastRecord[this.sortBy] ? lastRecord[this.sortBy] : 'NULL';
        this.lastId = lastRecord['Id'];
        this.first = false;
        this.last = (this.currentPage == this.totalPages);
        this.refreshButtons();
        this.updateDisplayedRecords();
    }

    handlePreviousPagination() {
        this.currentPage--;
        this.resetFields();
        var firstRecord = this.records[0];
        this.before = firstRecord[this.sortBy] ? firstRecord[this.sortBy] : 'NULL';
        this.firstId = firstRecord['Id'];
        this.first = (this.currentPage == 1);
        this.refreshButtons();
        this.updateDisplayedRecords();
    }

    handleLast() {
        this.currentPage = this.totalPages;
        this.resetFields();
        this.first = false;
        this.last = true;
        this.lastPageSize = this.totalRecords % pageSize;
        this.refreshButtons();
        this.updateDisplayedRecords();
    }

    resetFields() {
        this.isLoading = true;
        this.before = '';
        this.firstId = '';
        this.after = '';
        this.lastId = '';
        this.first = true;
        this.last = false;
        this.lastPageSize = 0;
    }

    refreshButtons() {
        this.template.querySelectorAll('.icon_button').forEach(button => {
            button.classList.remove('icon_button_disabled');
        });
        if (this.last) {
            this.template.querySelector('[role=next]').classList.add('icon_button_disabled');
            this.template.querySelector('[role=last]').classList.add('icon_button_disabled');
        }
        if (this.first) {
            this.template.querySelector('[role=first]').classList.add('icon_button_disabled');
            this.template.querySelector('[role=previous]').classList.add('icon_button_disabled');
        }
    }

    get rowNumberOffset() {
        return (this.currentPage - 1) * pageSize;
    }

    updateDisplayedRecords() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.displayedRecords = [...this.filteredData.slice(start,end)];
    }

    handleSearch(event) {
        this.searchTerm = event.target.value.toLowerCase();
        this.currentPage = 1;
        if (this.searchTerm) {
            let searchKeywords = this.searchTerm.split(',').map(term => term.trim());

            this.filteredData = this.orderHistoryData.filter(account => {
                return searchKeywords.some(keyword =>
                    account.firstName && account.firstName.toLowerCase().includes(keyword)
                );
            });
        } else {
            this.filteredData = this.orderHistoryData;
        }

        this.updateDisplayedRecords();
    }


    async handleRowAction(event) {
        let orderID = event.detail.row.orderId;
        this.currentRecord = orderID;

        try {
            this.isLoading = true;

            const result = await getOrderForms({ ownID: `${orderID}` });

            sessionStorage.removeItem('orderFormData');
            this.productData = [];

            this.records = result;
            this.customer = {
                Salutation: this.records[0].salutation,
                FirstName: this.records[0].firstName,
                LastName: this.records[0].lastName,
                WithoutRx: this.records[0].withoutRX,
                PO: this.records[0].PO,
                CompanyName: this.records[0].companyName,
                Fax: this.records[0].fax,
                BillingAddress: {
                    billingState: this.records[0].billingState,
                    billingStreet: this.records[0].billingStreet,
                    billingZipCode: this.records[0].billingZipCode,
                    billingCity: this.records[0].billingCity
                },
                comments: this.records[0].comments,
                ShippingAddress: {
                    shippingStreet: this.records[0].shippingStreet,
                    shippingZipCode: this.records[0].shippingZipCode,
                    shippingState: this.records[0].shippingState,
                    shippingCountry: this.records[0].shippingCountry,
                    shippingCity: this.records[0].shippingCity
                },
                salutation: this.records[0].salutation,
                Email: this.records[0].emailId,
                Phone: this.records[0].phone
            };

            let newRecords = [];

            for (let i = 0; i < this.records[0].products.length; i++) {
                let length = this.productData.length + newRecords.length + 1;
                let product = this.records[0].products[i];

                if (product.isMasterProduct) {
                    let data = await fetchProductOptions({ productId: product.productId });
                    let orderedProductIds = this.records[0].products.map(prod => String(prod.productId));
                    let productOptionsList = data.map(option => ({
                        id: option.Id,
                        name: option.Name,
                        master_product: option.SBQQ__ConfiguredSKU__r.Id,
                        master_product_name: option.SBQQ__ConfiguredSKU__r.Name,
                        product_name: option.SBQQ__ProductName__c,
                        sku: option.SBQQ__OptionalSKU__c,
                        selected: orderedProductIds.includes(String(option.SBQQ__ConfiguredSKU__c)),
                        disabled: option.SBQQ__Required__c
                    }));

                    newRecords.push({
                        index: length.toString(),
                        product_id: product.productId,
                        productName: product.Name,
                        productOptionsList: productOptionsList, // Updated list
                        quantity: product.quantity ?? 1,
                        subtotal: product.subtotalPrice ?? 0,
                        actualPrice: product.actualPrice ?? 0,
                        discountPrice: product.discountPrice ?? 0
                    });
                    this.productOptionsUpdatedList = [...this.productOptionsUpdatedList,...productOptionsList];
                }
            }

            this.productData = [...this.productData,...newRecords];

            let jsonData = sessionStorage.getItem('orderFormData');
            jsonData = jsonData ? JSON.parse(jsonData) : {};
            jsonData.CustomerData = this.customer;
            jsonData.productData = this.productData;
            jsonData.PriceData = this.priceData;
            jsonData.customerId = "null";
            jsonData.orderFormId = this.records[0].orderId;
            jsonData.productOptionsUpdatedList = this.productOptionsUpdatedList;
            sessionStorage.setItem('orderFormData',JSON.stringify(jsonData));
            this.orderHistoryPage = false;
            this.orderDetailPage = true;
            this.isLoading = false;
        } catch (error) {
            this.isLoading = false;
            console.error(error);
        }
    }

    @track step = '2';
    @track isButtonDisable = true;
    @track isNextButtonDisabled = true;
    @track isToShow = false;

    currentRecordID;
    currentRecord;
    @track orderid;

    @track stepStatus = { step2: false,step3: false,step4: false,step5: false };

    status = [
        { label: 'Customer Details',value: '2' },
        { label: 'Products & Price Details',value: '3' },
        { label: 'Documents',value: '4' },
        { label: 'Summary',value: '5' }

    ];

    connectedCallback() {
        const style = document.createElement('style');
        style.innerText = `
            .slds-path__nav .slds-is-current:first-child{
                border-top-right-radius: 10px;
                border-bottom-right-radius: 10px;
                border: 2px solid #00a1e0;
            }
            .slds-path__nav .slds-is-current:first-child:hover{
                border-top-right-radius: 10px;
                border-bottom-right-radius: 10px;
                border: 2px solid #00a1e0;
            }
            .slds-path__nav .slds-is-current:first-child:after, .slds-path__nav .slds-is-current:first-child:before {
                border-right: 2px solid #00a1e0;
            }
            .slds-path__item.slds-is-current:not(:first-child):after {
                border: 2px solid #00a1e0;
                border-top: 0;
            }
            .slds-path__item.slds-is-current:not(:first-child):before {
                border: 2px solid #00a1e0;
                border-bottom: 0;
            }
            .custom-button button:hover:before {
                background: transparent;
                border: none;
            }
            .slds-path__nav .slds-is-active .slds-path__link{
                color:black;
            }
            .slds-path__link:focus {
                box-shadow: none;
            }
            .slds-button_neutral:hover.slds-button:hover{
                background:transparent;
                color:#00a1e0;
            }
            .slds-path__stage-name{
                display: none;
            }

            .slds-path__nav {
                overflow: scroll;
                -ms-overflow-style: none;
                scrollbar-width: none;
            }

            .slds-path__item {
                min-width: 10rem;
            }
        `;
        document.head.appendChild(style);
        loadStyle(this,NoHeader)

        const storedData = sessionStorage.getItem('orderFormData');
        if (storedData) {
            var parsedJson = JSON.parse(storedData);
            if (parsedJson?.CustomerData) {
                this.customer = parsedJson.CustomerData;
                this.productData = parsedJson.productData
                this.priceData = parsedJson.priceData
            }
        }
    }


    handleProgress(event) {
        const stepValue = parseInt(event.target.value,10);
        const keys = Object.keys(this.stepStatus);
        const value = this.stepStatus[keys[stepValue - 1]];

        if (value) {
            this.step = (event.target.value).toString();
            this.updateButtonStates();
        }
    }

    handleConfirmation() {
        this.orderHistoryPage = true;
        this.orderDetailPage = false;
        sessionStorage.removeItem('orderFormData');
        // window.location.reload();
        this.stepStatus = { step2: true,step3: false,step4: false,step5: false };
        this.step = '2';
    }

    handleStatuses(event) {
        this.stepStatus.step2 = event.detail.staticStepStatus.step2;
        this.stepStatus.step3 = event.detail.staticStepStatus.step3;
        this.stepStatus.step4 = event.detail.staticStepStatus.step4;
        this.stepStatus.step5 = event.detail.staticStepStatus.step5;
    }

    handleNext() {
        if (this.step <= this.status.length) {
            this.step = (Number(this.step) + 1).toString();

            if (this.step !== '2') {
                this.updateButtonStates();
            }
            else {
                this.isButtonDisable = this.step === '2';
                this.isNextButtonDisabled = true;
            }
        }
    }

    handlePrevious() {
        if (this.step > 2) {
            this.step = (Number(this.step) - 1).toString();
            this.updateButtonStates();
        } else {
            this.orderHistoryPage = true;
            this.orderDetailPage = false;
        }
    }

    handleRecordID(event) {
        this.isNextButtonDisabled = !(event.detail.showNextButton);
        this.currentRecordID = event.detail.accountId;
    }

    handleFormValidation(event) {
        this.isButtonDisable = this.step === '1';
        this.isNextButtonDisabled = !(event.detail.isValid);
    }

    updateButtonStates() {
        this.isButtonDisable = this.step === '1';
        this.isNextButtonDisabled = this.step === this.status.length;
    }

    handleProductValidation(event) {
        this.isButtonDisable = this.step === '2';
        this.isNextButtonDisabled = !(event.detail.productValidation);
    }

    handleClick(event) {
        const orderFormId = event.target.dataset.orderid;
        resendMail({ subject: 'Order Confirmation and Payment Link',recordID: orderFormId });
    }

    get progress() {
        return this.status.map((label,index) => ({
            label,
            isActive: index + 1 === this.step,
        }));
    }


    get isStep2() {
        return this.step === '2';
    }

    get isStep3() {
        return this.step === '3';
    }

    get isStep4() {
        return this.step === '4';
    }

    get isStep5() {
        return this.step === '5';
    }
}