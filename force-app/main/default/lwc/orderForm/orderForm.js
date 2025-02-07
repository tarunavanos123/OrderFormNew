import { LightningElement,track,api } from 'lwc';
import NoHeader from '@salesforce/resourceUrl/NoHeader';
import { loadStyle,loadScript } from 'lightning/platformResourceLoader';

export default class ParentCompo extends LightningElement {

    @track step = '1';
    @track isButtonDisable = true;
    @track isNextButtonDisabled = true;
    @track isToShow = false;

    currentRecordID;
    @track confirmationMessage=false;
    @track orderid;

    @track stepStatus = {step1 : false, step2 : false, step3: false, step4 : false, step5: false};

    status = [
        { label: 'Customer Type',value: '1' },
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
    }


    handleProgress(event) {
        const stepValue = parseInt(event.target.value, 10);
        const keys = Object.keys(this.stepStatus);
        const value = this.stepStatus[keys[stepValue - 1]];

        if (value) {
            this.step = (event.target.value).toString();
            this.updateButtonStates();
        } else {
            const stepElements = this.template.querySelector('.slds-is-incomplete.slds-is-active');
            if (stepElements) {
                stepElements.classList.remove('slds-is-active');
            }

        }
    }

    handleConfirmation(event) {

        this.orderid=event.detail.orderid;
        this.confirmationMessage = true;
    }

    handleStatuses(event) {
        this.stepStatus.step1 = event.detail.staticStepStatus.step1; 
        this.stepStatus.step2 = event.detail.staticStepStatus.step2; 
        this.stepStatus.step3 = event.detail.staticStepStatus.step3; 
        this.stepStatus.step4 = event.detail.staticStepStatus.step4; 
        this.stepStatus.step5 = event.detail.staticStepStatus.step5;
    }



    handleNext() {
        if (this.step < this.status.length) {
            this.step = (Number(this.step) + 1).toString();
            if (this.step !== '2') {
                this.updateButtonStates();
            }
            else {
                this.isButtonDisable = this.step === '1';
                this.isNextButtonDisabled = true;
            }
        }
    }

    handlePrevious() {
        if (this.step > 1) {
            this.step = (Number(this.step) - 1).toString();
            this.updateButtonStates();
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

    get progress() {
        return this.status.map((label,index) => ({
            label,
            isActive: index + 1 === this.step,
        }));
    }

    get isStep1() {
        return this.step === '1';
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