import React, { Component, PropTypes } from 'react';

export default class BaseView extends Component {
    componentWillUnmount() {
        super.componentWillUnmount && super.componentWillUnmount();
        this.unmounted = true;
    }
}
