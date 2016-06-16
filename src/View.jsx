import React from 'react';

export default class View extends React.Component {
    componentWillUnmount() {
        super.componentWillUnmount && super.componentWillUnmount();
        this.unmounted = true;
    }
}
