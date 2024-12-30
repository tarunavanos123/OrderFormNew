import { LightningElement, track, api } from 'lwc';
import NoHeader from '@salesforce/resourceUrl/NoHeader';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';

export default class ParentCompo extends LightningElement {

    @track step = '1';
    @track isButtonDisable = true;
    @track isNextButtonDisabled = true;
    @track isToShow = false;

    currentRecordID;

    status = [
        { label: 'Customer Type', value: '1' },
        { label: 'Customer Details', value: '2' },
        { label: 'Products & Price Details', value: '3' },
        { label: 'Documents', value: '4' },
        { label: 'Summary', value: '5' }

    ];

    connectedCallback() {
        loadStyle(this, NoHeader)
    }

    handleProgress(event){
            this.step = (event.target.value).toString();
            this.updateButtonStates();
    }


    handleNext() {
        if (this.step < this.status.length) {
            this.step = (Number(this.step) + 1).toString();
            if (this.step !== '2' ) {
                this.updateButtonStates();
            }
            else {
                this.isButtonDisable = this.step === '1';
                this.isNextButtonDisabled =  true;
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
        this.isNextButtonDisabled =  ! (event.detail.isValid);
    }

    updateButtonStates() {
        this.isButtonDisable = this.step === '1';
        this.isNextButtonDisabled = this.step === this.status.length;
    }

    handleProductValidation(event) {
        this.isButtonDisable = this.step === '2';
        this.isNextButtonDisabled =  !(event.detail.productValidation);
    }

    get progress() {
        return this.status.map((label, index) => ({
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