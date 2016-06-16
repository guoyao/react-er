import View from './View';

export default class DetailView extends View {
    fetchData() {

    }

    componentDidMount() {
        super.componentDidMount && super.componentDidMount();

        const {history} = this.props;
        history.listen(() => {
            if (!this.unmounted) {
                this.fetchData();
            }
        });
    }
}
