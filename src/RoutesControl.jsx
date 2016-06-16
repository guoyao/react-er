/**
 * @file 路由控制器，提供路由的灵活配置，动态扩展及任意的重定向功能
 * @author chenqiang, wuguoyao(chenqiang03@baidu.com, wuguoyao@baidu.com)
 */

import u from 'underscore';
import React from 'react';
import ReactDOM from 'react-dom';
import {Router, Route} from 'react-router';
import createHashHistory from 'history/lib/createHashHistory';

/* // 顺序有讲究
const routes = (
    <Route path="/" component={App}>
        <Redirect from="/index" to="/about" />
        <Route path="/about" component={About} />
        <IndexRoute component={Index} />
        <Route path="*" component={NoMatch} />
    </Route>
); */

/**
 * @typedef {Object} Route
 * @property {string} path 路径规则
 * @property {Object<React.Class>} component 接管路径的目标控件
 * @property {Object} indexRoute 默认路由
 * @property {Array<Route>} childRoutes 子路由系列
 *
 * @example
 *
 * ```js
 *      const routes = {
 *          path: '/',
 *          component: App,
 *          indexRoute: {
 *              component: IndexModRoute[0].component
 *          },
 *          childRoutes: [
 *              {path: '/index', component: Index, indexRoute: {...}, childRoutes: {...}},
 *              {path: '/about', component: About},
 *              {
 *                  path: '/some',
 *                  onEnter(nextState, replaceState) {
 *                     replaceState(null, '/about')
 *                  }
 *              },
 *              // 无法解析的路径，永远放置在最后
 *              {path: '*', component: NoMatch}
 *          ]
 *      };
 * ```
 */


/**
 * 路由控制模型，支持动态扩展路由
 * 将`react-router`提供的路由配置封装成`RoutesControl`模型
 * 维持原路由的树状结构
 * 提供路由的基本配置、启动等相关方法
 *
 * TODO: 路由的删除，路由停用功能
 *
 * @class
 */
export default
class RoutesControl {

    /**
     * 路由控制模型
     *
     * @param {Route} options 路由配置
     * @constructor
     */
    constructor(options = {}) {
        this.routes = {
            path: '/',
            component: null,
            indexRoute: {},
            childRoutes: []
        };

        u.extend(this.routes, options);

        this.initChildRoutes();
    }

    /**
     * 初始化子路由
     * 首次构建实例时，需要将`childRoutes`中的子路由进行封装
     */
    initChildRoutes() {
        let childRoutes = this.routes.childRoutes;
        if (childRoutes && childRoutes.length) {
            let tmpChildRoutes = u.clone(childRoutes);
            childRoutes.length = 0;
            this.addChildRoutes(tmpChildRoutes);
        }
    }

    /**
     * 路由启动方法
     */
    start() {
        let history = createHashHistory({
            // queryKey: false
        });

        ReactDOM.render(
            <Router history={history} onUpdate={this.handleUpdate(this)}>
                {this.getRoutes()}
            </Router>,
            document.getElementById('react-app')
        );
    }

    /**
     * 获取真正的路由值
     * `childRoute` 都是被控制器封装后的模型
     * 取值时将去除这层外壳的封装
     *
     * @return {Route} 真实的路由配置
     */
    getRoutes() {
        let plainRoute = {};
        let childRoutes = this.routes.childRoutes;
        if (childRoutes && childRoutes.length) {
            let plainChildRoutes = [];
            u.each(
                childRoutes,
                childRoute => plainChildRoutes.push(childRoute.getRoutes())
            );
            plainRoute = u.chain(this.routes)
                .clone()
                .extend({childRoutes: plainChildRoutes})
                .value();
        }
        else {
            plainRoute = this.routes;
        }

        return plainRoute;
    }

    /**
     * 是否是合法的路由对象
     * - 首先得是一个对象
     * - 其次都有个 `path` 属性
     *
     * @param {Route} route 路由对象
     * @return {boolean} true 为合法路径反之非法
     */
    isValidRoute(route) {
        return (route instanceof RoutesControl)
            || (
                u.isObject(route)
                && (u.has(route, 'path') || u.has(route, 'name'))
            );
    }

    /**
     * 是否是泛路由规则
     *
     * @param {Route} route 给定路由
     * @return {boolean} true为泛路由，反之不是
     */
    isNoMatchRoute(route) {
        if (route instanceof RoutesControl) {
            route = route.getRoutes();
        }
        return u.isObject(route)
            && (route.name === '*' || route.path === '*');
    }

    /**
     * 以给定的配置创建当前类型的另一个实例，用于封装 `Child`
     *
     * @param {Route} route 提供的配置项
     * @return {Object<RoutesControl>} 返回创建成功的实例
     */
    createInstance(route) {
        let instance = null;
        if (route instanceof RoutesControl) {
            instance = route;
        }
        else {
            instance = new this.constructor(route);
        }

        return instance;
    }

    /**
     * 添加默认路由
     *
     * @param {Object<React.Class>} component 接管默认路由的控件
     */
    addIndexRoute(component) {
        this.routes.indexRoute.component = component;

        return this;
    }

    /**
     * 添加子路由
     *
     * @param {Route} route 待添加的子路由
     */
    addChildRoute(route) {
        if (this.isValidRoute(route)) {
            route = this.createInstance(route);

            let childRoutes = this.routes.childRoutes;
            let lastRoute = u.last(childRoutes);

            // 这样就支持 `NoMatch` 的任意顺序流了
            // 再也不担心 `NoMatch` 的提前接管，导致404一片
            if (this.isNoMatchRoute(lastRoute)) {
                let restRoutes = u.initial(childRoutes);

                // `NoMath` rule is always at the end
                restRoutes.push(route, lastRoute);

                this.routes.childRoutes = restRoutes;
            }
            else {
                childRoutes.push(route);
            }
        }

        return this;
    }

    /**
     * 批量添加子路由
     *
     * @param {Array<Route>} routes 子路由系列
     */
    addChildRoutes(routes) {
        u.each(routes, route => this.addChildRoute(route));

        return this;
    }

    /**
     * 添加泛路径路由，一般用于路由末尾处理404情况
     *
     * @param {Object<React.Class>} component 接管泛路径的控件
     */
    addNoMatchRoute(component) {
        this.addChildRoute({path: '*', component: component});

        return this;
    }


    /**
     * 添加重定向路由，这个是 `Router` 支持的常规重定向
     * 会有诸多限制吧，如果父路由 `/customer` 重定向到子路由 `/customer/list`
     * 就很难在当前路由节点下直接配置，当然模块间跳转尽量用这个
     *
     * @param {string} from 源路径规则
     * @param {string} to 现有路径规则
     */
    addRedirectRoute(from, to) {
        this.addChildRoute({
            path: from,
            onEnter(nextState, replaceState) {
                replaceState(null, to);
            }
        });

        return this;
    }

    /**
     * `URL` 变化处理句柄，主要用于处理父子路由间 redirect
     * 同时又保持路由树的层次性，强迫症患者良药
     *
     * @param {Object<RoutesControl>} context 当前 Control 上下文
     * @return {Function} update事件的句柄
     */
    handleUpdate(context) {

        /**
         * 执行URL重定向的函数，采用闭包的原因是为了递归时
         * `context` 得到正确的传递
         *
         * @param {Object<RoutesControl>} context 当前 Control 上下文
         * @return {Function} 实际的处理方法
         */
        function doRedirect(context) {
            return function () {
                let path = context.routes.path;
                let pathname = this.state.location.pathname;


                // 如果本身具有 `redirectTo` 属性，就执行重定向
                if (
                    context.routes.redirectTo
                    && context._isPathEqual(path, pathname)
                ) {

                    // 需要对路径进行一定的处理，将父路径继承下来
                    // 否则将失去路径的层级关系，出现错误
                    let currentPath = [
                        context._filterPath(path),
                        context._filterPath(context.routes.redirectTo)
                    ].join('/');

                    this.history.replaceState(null, currentPath);
                }

                // 对子路由进行全量遍历，如果子路由有 `redirectTo` 属性
                // 则对子路由再进行重定向
                u.each(context.routes.childRoutes, childRoute => {
                    doRedirect(childRoute).call(this);
                });
            }
        }

        return doRedirect(context);
    }


    /**
     * 根据 path 获取对应的 component，会遍历整颗路由树
     *
     * @example
     *     Input: '/customer/list'
     *     Output: customer/list 对应的component
     *
     * @param {string} path 查找的路径
     * @return {Function} component
     */
    getComponentFromPath(path) {
        let component = null;
        let pathItems = path.split('/');

        if (
            pathItems.length === 1
            && this._isPathEqual(pathItems[0], this.routes.path)
        ) {
            component = this.routes.component;
        }
        else {
            u.each(this.routes.childRoutes, childRoute => {
                component = component
                    || childRoute.getComponentFromPath(u.rest(pathItems).join('/'));
            });
        }

        return component;
    }

    /**
     * 判断两个路由是否相同
     * 'customer', '/customer', 'customer/', '/customer/'
     * 属于相同路由
     *
     * @param {string} path1 路由1
     * @param {string} path2 路由2
     * @return {boolean} true相同，反之不同
     */
    _isPathEqual(path1, path2) {
        return this._formatPath(path1) === this._formatPath(path2);
    }

    /**
     * 格式化路径
     * 将 'customer', '/customer', 'customer/', '/customer/'
     * 转换为 '/customer/'
     *
     * @param {string} path 待格式化的路径
     * @return {string} 格式化之后的路径
     */
    _formatPath(path) {
        path = this._filterPath(path);

        return `/${path}/`;
    }

    /**
     * 将路径两端的 '/' 去除
     *
     * @param {string} path 需要处理的路径
     * @return {string} 处理后的路径
     */
    _filterPath(path) {
        return path.replace(/^\/*/, '').replace(/\/*?$/, '');
    }
}
