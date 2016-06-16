import React from 'react';

import View from './View';

export default class FormView extends View {
    static propTypes = {
        ...View.propTypes,

        draftInterval: React.PropTypes.number,
        uniqueName: React.PropTypes.string
    }

    static defaultProps = {
        ...View.defaultProps,

        draftInterval: 60
    }

    constructor(...args) {
        super(...args);

        this.enableRecover = !!this.props.uniqueName;

        if (this.enableRecover) {
            this.saveToLocal = this.saveToLocal.bind(this);
        }

        this.submitSucceed = this.submitSucceed.bind(this);
    }

    saveToLocal() {
        const data = this.getRecoverData();

        if (this.uniqueName && data) {
            localStorage.setItem(this.uniqueName, JSON.stringify(data));
        }
    }

    getUniqueName() {
        return this.props.uniqueName;
    }

    getRecoverData() {
        return this.refs.form && this.refs.form.getValues();
    }

    recover() {

    }

    submitSucceed() {
        if (this.enableRecover) {
            localStorage.removeItem(this.uniqueName);
        }
    }

    componentDidMount() {
        super.componentDidMount && super.componentDidMount();

        if (this.enableRecover) {
            this.uniqueName = this.getUniqueName();
            this.timer = setInterval(this.saveToLocal, this.props.draftInterval * 1000);
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount && super.componentWillUnmount();
        this.timer && clearInterval(this.timer);
    }
}
