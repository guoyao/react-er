import BaseView from './BaseView';

export default class DetailView extends BaseView {
    fetchData() {
        
    }

    componentDidMount() {
        super.componentDidMount && super.componentDidMount();

        const { history } = this.props;
        history.listen(() => {
            if (!this.unmounted) {
                this.fetchData();
            }
        });
    }
}
