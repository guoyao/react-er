import React from 'react';

export default class BaseView extends React.Component {
    componentWillUnmount() {
        super.componentWillUnmount && super.componentWillUnmount();
        this.unmounted = true;
    }
}
