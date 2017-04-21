<a name="4.1.6"></a>
## [4.1.6](https://github.com/hypeJunction/hypeLists/compare/4.1.5...v4.1.6) (2017-04-21)


### Bug Fixes

* **ajax:** throttle simulatenous ajax requests ([3eea0fe](https://github.com/hypeJunction/hypeLists/commit/3eea0fe))



<a name="4.1.5"></a>
## [4.1.5](https://github.com/hypeJunction/hypeLists/compare/4.1.4...v4.1.5) (2017-02-27)


### Bug Fixes

* **lists:** do not wrap lists that set pagination to false explicitly ([a874cde](https://github.com/hypeJunction/hypeLists/commit/a874cde))



<a name="4.1.4"></a>
## [4.1.4](https://github.com/hypeJunction/hypeLists/compare/4.1.3...v4.1.4) (2016-10-16)


### Bug Fixes

* **lists:** only display pager navigation if explicitly set ([1d39775](https://github.com/hypeJunction/hypeLists/commit/1d39775))
* **lists:** wrap all lists that specify pagination type even if pagination is not required ([aec6d2b](https://github.com/hypeJunction/hypeLists/commit/aec6d2b))
* **views:** no longer WSODs in script mode ([496df99](https://github.com/hypeJunction/hypeLists/commit/496df99))
* **views:** script tag should go outside of the list wrapper ([5cae885](https://github.com/hypeJunction/hypeLists/commit/5cae885))



<a name="4.1.3"></a>
## [4.1.3](https://github.com/hypeJunction/hypeLists/compare/4.1.2...v4.1.3) (2016-09-21)


### Bug Fixes

* **bc:** honor legacy "rel" parameter in lists ([85dc5ba](https://github.com/hypeJunction/hypeLists/commit/85dc5ba))
* **forms:** hide field containing hidden submit button ([d74a950](https://github.com/hypeJunction/hypeLists/commit/d74a950))
* **forms:** override bottom margins on the sort fieldset ([f46284f](https://github.com/hypeJunction/hypeLists/commit/f46284f))
* **js:** on ajax response only replace the list view instead of the entire container ([d367b17](https://github.com/hypeJunction/hypeLists/commit/d367b17))
* **lists:** filter target should be passed explicitly ([e5c8c82](https://github.com/hypeJunction/hypeLists/commit/e5c8c82))

### Features

* **users:** add a filter to get users by online status ([c409170](https://github.com/hypeJunction/hypeLists/commit/c409170))



<a name="4.1.2"></a>
## [4.1.2](https://github.com/hypeJunction/hypeLists/compare/4.1.1...v4.1.2) (2016-09-15)


### Bug Fixes

* **js:** list events should not bubble up the DOM tree ([217cbe0](https://github.com/hypeJunction/hypeLists/commit/217cbe0))



<a name="4.1.1"></a>
## [4.1.1](https://github.com/hypeJunction/hypeLists/compare/4.1.0...v4.1.1) (2016-09-12)


### Bug Fixes

* **js:** correctly toggle form after sort/search action ([2ea177c](https://github.com/hypeJunction/hypeLists/commit/2ea177c))
* **ui:** expand search form by default ([ce47684](https://github.com/hypeJunction/hypeLists/commit/ce47684))



<a name="4.1.0"></a>
# [4.1.0](https://github.com/hypeJunction/hypeLists/compare/4.0.4...v4.1.0) (2016-09-11)


### Features

* **lists:** adds an interface for building sortable and searchable lists ([ae3fce9](https://github.com/hypeJunction/hypeLists/commit/ae3fce9))



<a name="4.0.4"></a>
## [4.0.4](https://github.com/hypeJunction/hypeLists/compare/4.0.3...v4.0.4) (2016-07-08)


### Bug Fixes

* **lists:** more reliable base_url normalization ([87608a8](https://github.com/hypeJunction/hypeLists/commit/87608a8)), closes [#22](https://github.com/hypeJunction/hypeLists/issues/22)
* **lists:** spinner is again shown when loading infinite lists ([71c30f7](https://github.com/hypeJunction/hypeLists/commit/71c30f7))



<a name="4.0.3"></a>
## [4.0.3](https://github.com/hypeJunction/hypeLists/compare/4.0.2...v4.0.3) (2016-07-08)




<a name="4.0.2"></a>
## [4.0.2](https://github.com/hypeJunction/hypeLists/compare/4.0.1...v4.0.2) (2016-04-14)


### Bug Fixes

* **lists:** do not lazy load pages by default ([0883468](https://github.com/hypeJunction/hypeLists/commit/0883468))
* **lists:** strip limit and offset from base_url ([de63df4](https://github.com/hypeJunction/hypeLists/commit/de63df4))



<a name="4.0.1"></a>
## [4.0.1](https://github.com/hypeJunction/hypeLists/compare/4.0.0...v4.0.1) (2016-04-14)


### Bug Fixes

* **views:** make sure all lists have a base_url ([3977132](https://github.com/hypeJunction/hypeLists/commit/3977132))



<a name="4.0.0"></a>
# [4.0.0](https://github.com/hypeJunction/hypeLists/compare/3.5.6...v4.0.0) (2016-02-23)


### Features

* **compat:** drop support for earlier Elgg versions ([c76903d](https://github.com/hypeJunction/hypeLists/commit/c76903d))
* **js:** rewrite JS to AMD modules ([90149db](https://github.com/hypeJunction/hypeLists/commit/90149db))
* **pagination:** always add first and last page with ellipsis to the pagination ([86226c0](https://github.com/hypeJunction/hypeLists/commit/86226c0))
* **spinner:** use core spinner ([65e8f3e](https://github.com/hypeJunction/hypeLists/commit/65e8f3e))
* **usability:** move list classes into a standlone library ([58e804b](https://github.com/hypeJunction/hypeLists/commit/58e804b))
* **usability:** rearrange handlers ([3ddbf01](https://github.com/hypeJunction/hypeLists/commit/3ddbf01))


### BREAKING CHANGES

* spinner: showLoader and hideLoader events are no longer triggered. Core elgg/spinner is
used instead.
* usability: List classes are no longer included in the plugin. Use hypejunction/api-lists
in your project if you are using those classes
* usability: hypeJunction\Lists namespace has been dropped, and handlers have been
prefixed with hypelists_ instead.
lib/hooks.php has been merged with start.php
* compat: The plugin now requires at least Elgg 2.0



<a name="3.5.6"></a>
## [3.5.6](https://github.com/hypeJunction/hypeLists/compare/3.5.5...v3.5.6) (2016-02-15)


### Bug Fixes

* **js:** make sure $items are set ([2357bf9](https://github.com/hypeJunction/hypeLists/commit/2357bf9))
* **lists:** improve delete logic ([84ea62d](https://github.com/hypeJunction/hypeLists/commit/84ea62d))



<a name="3.5.5"></a>
## [3.5.5](https://github.com/hypeJunction/hypeLists/compare/3.5.4...v3.5.5) (2016-01-25)


### Bug Fixes

* **js:** fix how ajax list data is stored ([8064b74](https://github.com/hypeJunction/hypeLists/commit/8064b74))



<a name="3.5.4"></a>
## [3.5.4](https://github.com/hypeJunction/hypeLists/compare/3.5.3...v3.5.4) (2016-01-25)


### Bug Fixes

* **js:** fix variable name ([a2f3e30](https://github.com/hypeJunction/hypeLists/commit/a2f3e30))

### Features

* **js:** store list data on init and ajax load ([208563b](https://github.com/hypeJunction/hypeLists/commit/208563b))
* **js:** store list data on init and ajax load ([438cced](https://github.com/hypeJunction/hypeLists/commit/438cced))



<a name="3.5.3"></a>
## [3.5.3](https://github.com/hypeJunction/hypeLists/compare/3.5.2...v3.5.3) (2016-01-24)


### Bug Fixes

* **js:** doh, js event name ([e2529c2](https://github.com/hypeJunction/hypeLists/commit/e2529c2))



<a name="3.5.2"></a>
## [3.5.2](https://github.com/hypeJunction/hypeLists/compare/3.5.1...v3.5.2) (2016-01-24)


### Features

* **js:** trigger ready event when list is rendered ([cb472b6](https://github.com/hypeJunction/hypeLists/commit/cb472b6))



<a name="3.5.1"></a>
## [3.5.1](https://github.com/hypeJunction/hypeLists/compare/3.5.0...v3.5.1) (2016-01-24)


### Bug Fixes

* **js:** run initialization script only once ([ee5736e](https://github.com/hypeJunction/hypeLists/commit/ee5736e))



<a name="3.5.0"></a>
# [3.5.0](https://github.com/hypeJunction/hypeLists/compare/3.4.1...v3.5.0) (2016-01-23)


### Features

* **js:** adds more public event triggers ([79dd720](https://github.com/hypeJunction/hypeLists/commit/79dd720))
* **lists:** better handling of empty lists ([cb44929](https://github.com/hypeJunction/hypeLists/commit/cb44929))



<a name="3.4.1"></a>
## [3.4.1](https://github.com/hypeJunction/hypeLists/compare/3.4.0...v3.4.1) (2015-12-28)


### Bug Fixes

* **js:** always trigger initialize event after AMD module is loaded ([8397e61](https://github.com/hypeJunction/hypeLists/commit/8397e61))
* **js:** correctly parse loader CSS class when spinner is not loaded ([5d21c65](https://github.com/hypeJunction/hypeLists/commit/5d21c65)), closes [#16](https://github.com/hypeJunction/hypeLists/issues/16)



<a name="3.4.0"></a>
# [3.4.0](https://github.com/hypeJunction/hypeLists/compare/3.3.2...v3.4.0) (2015-12-27)


### Bug Fixes

* **api:** fix default list id ([00e2add](https://github.com/hypeJunction/hypeLists/commit/00e2add))
* **css:** clean up CSS and get rid of SASS ([012cd43](https://github.com/hypeJunction/hypeLists/commit/012cd43))
* **css:** css makes no sense, get rid of it ([4793c25](https://github.com/hypeJunction/hypeLists/commit/4793c25))
* **delete:** ajax delete now respects confirmations response ([1d20ce3](https://github.com/hypeJunction/hypeLists/commit/1d20ce3)), closes [#12](https://github.com/hypeJunction/hypeLists/issues/12)
* **deps:** hypeApps is not really required, get rid of it ([1463bef](https://github.com/hypeJunction/hypeLists/commit/1463bef))
* **js:** clean AMD module structure ([08adf28](https://github.com/hypeJunction/hypeLists/commit/08adf28))
* **lists:** lists now do not break in non-default viewtypews ([79039e8](https://github.com/hypeJunction/hypeLists/commit/79039e8)), closes [#14](https://github.com/hypeJunction/hypeLists/issues/14)
* **lists:** properly handle no results ([9e811df](https://github.com/hypeJunction/hypeLists/commit/9e811df)), closes [#8](https://github.com/hypeJunction/hypeLists/issues/8)

### Features

* **events:** trigger a change event whenever items visibility is toggled ([1834a89](https://github.com/hypeJunction/hypeLists/commit/1834a89)), closes [#13](https://github.com/hypeJunction/hypeLists/issues/13)
* **spinner:** use Elgg spinner module if available ([0bb2f6f](https://github.com/hypeJunction/hypeLists/commit/0bb2f6f))



<a name="3.3.2"></a>
## [3.3.2](https://github.com/hypeJunction/hypeLists/compare/3.3.2...v3.3.2) (2015-12-27)




<a name="3.3.2"></a>
## [3.3.2](https://github.com/hypeJunction/hypeLists/compare/3.3.1...3.3.2) (2015-10-20)


### Bug Fixes

* **manifest:** grunt needs type attribute ([993097d](https://github.com/hypeJunction/hypeLists/commit/993097d))



<a name="3.3.1"></a>
## [3.3.1](https://github.com/hypeJunction/hypeLists/compare/3.3.0...3.3.1) (2015-10-20)


### Bug Fixes

* **js:** use inline require to load amd modules on ajax ([5af7386](https://github.com/hypeJunction/hypeLists/commit/5af7386))



<a name="3.3.0"></a>
# [3.3.0](https://github.com/hypeJunction/hypeLists/compare/3.2.0...3.3.0) (2015-08-22)




<a name="3.2.0"></a>
# [3.2.0](https://github.com/hypeJunction/hypeLists/compare/3.1.1...3.2.0) (2015-07-30)


### Bug Fixes

* **amd:** requirejs does not like jquery plugin served from simplecache ([b7672e2](https://github.com/hypeJunction/hypeLists/commit/b7672e2))
* **js:** kill event with die ([c6c8d3a](https://github.com/hypeJunction/hypeLists/commit/c6c8d3a))
* **js:** remove duplicate confirmation dialogs ([7324368](https://github.com/hypeJunction/hypeLists/commit/7324368))
* **js:** remove duplicate confirmation dialogs ([ba51db4](https://github.com/hypeJunction/hypeLists/commit/ba51db4))
* **lists:** treat elgg-gallery as elgg-list ([bd81d7d](https://github.com/hypeJunction/hypeLists/commit/bd81d7d))



<a name="3.1.1"></a>
## [3.1.1](https://github.com/hypeJunction/hypeLists/compare/3.1.0...3.1.1) (2015-07-28)


### Bug Fixes

* **manifest:** fix manifest ([e308ae5](https://github.com/hypeJunction/hypeLists/commit/e308ae5))



<a name="3.1.0"></a>
# [3.1.0](https://github.com/hypeJunction/hypeLists/compare/3.0.0...3.1.0) (2015-07-28)




<a name="3.0.0"></a>
# 3.0.0 (2015-01-12)




