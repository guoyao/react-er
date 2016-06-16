import BaseView from './BaseView';
import util from '../../util/tool';

export default class FormView extends BaseView {
    static propTypes = {
        ...BaseView.propTypes,
        draftInterval: React.PropTypes.number,
        uniqueName: React.PropTypes.string
    }

    static defaultProps = {
        ...BaseView.defaultProps,
        draftInterval: 60,
        uniqueName: ''
    }

    constructor(...args) {
        super(...args);

        this.submitSucceed = this.submitSucceed.bind(this);
        this.enableRecover = !!this.props.uniqueName;

        if (this.enableRecover) {
            this._saveToLocal = this._saveToLocal.bind(this);
        }
    }

    _saveToLocal() {
        const data = this.getRecoverData();

        if (this.uniqueName && data) {
            localStorage.setItem(this.uniqueName, JSON.stringify(data));
        }
    }

    getUniqueName() {
        return util.getUniqueName(this.props.uniqueName);
    }

    getRecoverData() {
        return this.refs.form && this.refs.form.getValues();
    }

    // recover() {
    //     return this.uniqueName && util.parseJson(localStorage.getItem(this.uniqueName));
    // }

    submitSucceed() {
        if (this.enableRecover) {
            localStorage.removeItem(this.uniqueName);
        }
    }

    componentDidMount() {
        super.componentDidMount && super.componentDidMount();

        if (this.enableRecover) {
            this.uniqueName = this.getUniqueName();
            this.timer = setInterval(this._saveToLocal, this.props.draftInterval * 1000);
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount && super.componentWillUnmount();
        this.timer && clearInterval(this.timer);
    }
}
