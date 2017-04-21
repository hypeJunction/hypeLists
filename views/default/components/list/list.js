define(function (require) {

	var elgg = require('elgg');
	var $ = require('jquery');
	var spinner = require('elgg/spinner');

	/**
	 * List constructor
	 *
	 * @param {obj} element List container
	 * @param {obj} options List option
	 * @returns {hypeList}
	 */
	var hypeList = function (element, options) {
		var self = this;

		self.element = element;
		self.$elem = $(element);
		self.options = options;

		self.options.count = self.options.count || 0;
		self.options.offset = Math.abs(self.options.offset || 0);
		self.options.limit = self.options.limit || 10;
		self.options.listOffset = -(self.options.offset % self.options.limit);

		self.options.activePage = self.options.activePage || self.options.limit === 0 && 1 || Math.ceil(self.options.offset / self.options.limit) + 1;
		self.options.visiblePages = [self.options.activePage];
		self.options.loadedPages = [self.options.activePage];
		self.options.loadingPages = {};
		self.options.totalPages = Math.ceil(self.options.count / self.options.limit);

		self.options.baseUrl = self.options.baseUrl || window.location.href;
		self.options.baseUrlParts = elgg.parse_url(self.options.baseUrl);
		if (typeof self.options.baseUrlParts.fragment !== 'undefined') {
			self.options.baseUrl = self.options.baseUrl.replace('#' + self.options.baseUrlParts.fragment, '');
			delete self.options.baseUrlParts.fragment;
		}

		self.options.offsetKey = self.options.offsetKey || 'offset';

		self.options.pager = self.options.pager || 'visible';
		self.options.pagination = self.options.pagination || 'default';
		self.options.paginationPosition = self.options.paginationPosition || 'after';

		self.$list = self.$elem;
		self.$pagination = self.$list.siblings('.elgg-pagination');

		self.prepareDom();
		self.bindEvents();
	};

	/**
	 * hypeList prototype
	 */
	hypeList.prototype = {
		/**
		 * Constructor definition
		 */
		constructor: hypeList,
		/**
		 * Check if method is public
		 *
		 * @param {string} method Method name
		 * @returns {array}
		 */
		isPublicMethod: function (method) {
			return ['init', 'goToPage', 'fetchNewItems', 'addFetchedItems', 'removeItems'].indexOf(method) >= 0;
		},
		/**
		 * Prepare initial DOM structure
		 * @returns {void}
		 */
		prepareDom: function () {
			var self = this;

			self.$noResults = false;
			if (self.$elem.is('.elgg-no-results')) {
				self.$list = $('<ul>').addClass(self.options.listClasses).hide();
				self.$elem.before(self.$list);
				self.$noResults = self.$elem;
				self.$elem = self.$list;
			} else if (self.options.textNoResults) {
				self.$noResults = $('<p>').addClass('elgg-no-results').text(self.options.textNoResults).hide();
				self.$list.after(self.$noResults);
			}

			self.addPageItems(self.options.activePage, self.$list.children().removeClass(self.options.classHidden).addClass(self.options.classVisible));

			self.$list.siblings('.elgg-pagination').remove();

			var $pagination = $('<ul></ul>').addClass('elgg-pagination').addClass('elgg-pagination-' + self.options.pagination);
			var $before = $pagination.clone().addClass('elgg-pagination-before').data('position', 'before');
			var $after = $pagination.clone().addClass('elgg-pagination-after').data('position', 'after');


			if (self.options.paginationPosition === 'before' || self.options.paginationPosition === 'both') {
				self.$list.before($before);
			}
			if (self.options.paginationPosition === 'after' || self.options.paginationPosition === 'both') {
				self.$list.after($after);
			}

			self.$pagination = self.$list.siblings('.elgg-pagination');
			if (self.options.pager === 'visible') {
				self.$pagination.show();
			} else {
				self.$pagination.hide();
			}
		},
		/**
		 * Event binding
		 * @returns {void}
		 */
		bindEvents: function () {
			var self = this;
			$(self).off('.hypeList');
			$(self).on('ready.hypeList pageSwitched.hypeList pageShown.hypeList newItemsFetched.hypeList itemsRemoved.hypeList', self.paginate);
			$(self).on('ready.hypeList pageSwitched.hypeList pageShown.hypeList itemsRemoved.hypeList', self.lazyLoad);
			$(self).on('pageSwitched.hypeList pageShown.hypeList newItemsFetched.hypeList itemsRemoved.hypeList', self.toggleItemVisibility);
			$(self).on('pageSwitched.hypeList', self.scrollToTop);
			$(self).on('ready.hypeList newItemsFetched.hypeList', self.setRefreshTimeout);

			self.$list.off('.hypeList');

			self.$list.on('goToPage.hypeList', function (e, pageIndex) {
				e.stopPropagation();
				this.goToPage(pageIndex);
			}.bind(self));
			self.$list.on('refresh.hypeList fetchNewItems.hypeList', function (e, pageIndex, goToPage) {
				e.stopPropagation();
				this.fetchNewItems(pageIndex, goToPage);
			}.bind(self));
			self.$list.on('removeItems.hypeList', function (e, $items) {
				e.stopPropagation();
				this.removeItems($items);
			}.bind(self));
			self.$list.on('addFetchedItems.hypeList', function (e, ajaxData, pageIndex, goToPage) {
				e.stopPropagation();
				this.addFetchedItems(ajaxData, pageIndex, goToPage);
			}.bind(self));

			if (self.options.selectorDelete) {
				$(self.options.selectorDelete).off('click'); // remove confirm handlers in earlier Elgg versions
				// this will be triggered before event is propagated to $(document)
				self.$list.off('click.hypeList', self.options.selectorDelete).on('click.hypeList', self.options.selectorDelete, self.deleteItem);
			}

		},
		/**
		 * Set timeout for automatic refresh of the list
		 * @returns {void}
		 */
		setRefreshTimeout: function () {
			var self = this;
			if (self.options.autoRefresh <= 0) {
				return;
			}

			// only set timeout if the page containing new items has been loaded
			var pageIndex;
			if (self.options.reversed) {
				pageIndex = (self.options.count % self.options.limit > 0) ? self.options.totalPages : self.options.totalPages + 1;
			} else {
				pageIndex = 1;
			}
			if (self.options.loadedPages.indexOf(pageIndex) === -1) {
				return;
			}
			if (self.timeout) {
				clearTimeout(self.timeout);
			}

			// We are adding a random offset of 0 to 10s so that multiple lists don't fire all at the same time
			self.timeout = setTimeout(function () {
				self.fetchNewItems.apply(self, []);
			}, self.options.autoRefresh * 1000 + Math.round(Math.random() * 10000));
		},
		/**
		 * Trigger init event
		 * @returns {void}
		 */
		init: function () {
			var self = this;
			$(self).trigger('ready');
			self.$list.trigger('ready', [self.options]);
		},
		/**
		 * Toggle visibility of items for visible pages
		 * @returns {void}
		 */
		toggleItemVisibility: function () {
			var self = this;

			var startPageIndex = Math.min.apply(null, self.options.visiblePages);
			var endPageIndex = Math.max.apply(null, self.options.visiblePages);

			var $pageItems = self.filterPageItems(startPageIndex, endPageIndex);

			self.$list.children().not($pageItems).removeClass(self.options.classVisible).addClass(self.options.classHidden);

			if ($pageItems.length === 0) {
				self.$list.hide();
				if (self.$noResults) {
					self.$noResults.show();
				}
			} else {
				self.$list.show();
				if (self.$noResults) {
					self.$noResults.hide();
				}
				$pageItems.removeClass(self.options.classHidden).addClass(self.options.classVisible);
			}

			self.$elem.trigger('change', [self.options]);
		},
		/**
		 * Scroll to top of the list once items have been replaced/displayed
		 *
		 * @param {object}  event     jQuery event
		 * @param {integer} pageIndex Page index
		 * @param {jQuery}  $items    List items
		 * @returns {void}
		 */
		scrollToTop: function (event, pageIndex, $items) {
			var self = this;
			if ($items && $items.length) {
				$('body').animate({scrollTop: $items.first().offset().top + self.options.scrollTopOffset}, 500);
			}
		},
		getPageOffset: function (pageIndex) {
			var self = this,
					offset = 0;
			offset = (pageIndex - 1) * self.options.limit + self.options.listOffset;
			return (offset < 0) ? 0 : offset;
		},
		getPageLimit: function (pageIndex) {
			var self = this,
					limit = self.options.limit;
			if (pageIndex === 1) {
				return self.options.limit + self.options.listOffset;
			}
			return limit;
		},
		/**
		 * Returns page URL from its index
		 * Adds limit and offset query parameters
		 *
		 * @param {int} pageIndex Page index
		 * @returns {string} URL of the page
		 */
		getPageHref: function (pageIndex) {

			var self = this;
			var parts = self.options.baseUrlParts,
					args = {},
					base = '';

			if (typeof parts.host === 'undefined') {
				if (self.options.baseUrl.indexOf('?') === 0) {
					base = '?';
					args = elgg.parse_str(parts['query']);
				}
			} else {
				if (typeof parts.query !== 'undefined') {
					args = elgg.parse_str(parts.query);
				}
				var split = self.options.baseUrl.split('?');
				base = split[0] + '?';
			}

			args['limit'] = self.getPageLimit(pageIndex);
			args[self.options.offsetKey] = self.getPageOffset(pageIndex);
			return base + $.param(args);
		},
		/**
		 * Load a new page and apply a callback
		 *
		 * @param {integer}  pageIndex Page index
		 * @param {Function} before    Before start callback function
		 * @param {Function} complete  Callback function
		 * @returns {void}
		 */
		loadPage: function (pageIndex, before, complete) {
			var self = this,
					before = before,
					complete = complete,
					pageIndex = pageIndex;

			if (self.options.loadedPages.indexOf(pageIndex) >= 0) {
				if (typeof complete === 'function') {
					complete.apply(self, [pageIndex]);
				}
			} else {
				if (!self.options.loadingPages[pageIndex]) {
					self.options.loadingPages[pageIndex] = elgg.post(self.getPageHref(pageIndex), {
						data: {
							controller: 'loadPage',
							page_index: pageIndex,
							list_time: self.options.listTime,
							list_id: self.options.listId
						},
						beforeSend: before,
						dataType: 'html'
					});
				}
				self.options.loadingPages[pageIndex].then(function (data) {
					self.options.loadingPages[pageIndex] = null;
					self.addPageOnLoad.apply(self, [pageIndex, data]);
					if (typeof complete === 'function') {
						complete.apply(self, [pageIndex, data]);
					}
				});
			}

		},
		/**
		 * Switch paginated list to a different page
		 *
		 * @param {integer} pageIndex Page index
		 * @returns {void}
		 */
		goToPage: function (pageIndex) {
			var self = this;
			if (self.options.pagination === 'infinite') {
				return self.showPage(pageIndex);
			}

			self.loadPage(pageIndex, self.showLoader, function (pageIndex) {
				self.options.activePage = pageIndex;
				self.options.visiblePages = [self.options.activePage];
				self.hideLoader();
				$(self).trigger('pageSwitched', [pageIndex, self.filterPageItems(pageIndex)]);
			});
		},
		/**
		 * Add a new page to the visible list
		 *
		 * @param {integer} pageIndex Page index
		 * @returns {void}
		 */
		showPage: function (pageIndex) {
			var self = this;
			if (self.options.pagination !== 'infinite') {
				return self.goToPage(pageIndex);
			}

			if (pageIndex > Math.max.apply(null, self.options.visiblePages)) {
				for (var i = Math.max.apply(null, self.options.visiblePages); i <= pageIndex; i++) {
					self.loadPage(i, self.showLoader, function (i) {
						self.options.visiblePages.push(i);
						self.hideLoader();
					});
				}
			} else {
				for (var i = Math.min.apply(null, self.options.visiblePages); i >= pageIndex; i--) {
					self.loadPage(i, self.showLoader, function (i) {
						self.options.visiblePages.push(i);
						self.hideLoader();
					});
				}
			}

			self.loadPage(pageIndex, self.showLoader, function (pageIndex) {
				self.options.activePage = pageIndex;
				self.hideLoader();
				$(self).trigger('pageShown', [pageIndex]);
			});
		},
		/**
		 * Fetch new page items
		 *
		 * @param {integer} pageIndex Optional. Page index
		 * @param {bool}    goToPage  Switch to page, if new items found
		 * @returns {void}
		 */
		fetchNewItems: function (pageIndex, goToPage) {
			var self = this,
					pageIndex = pageIndex,
					goToPage = goToPage;

			if (!pageIndex) {
				if (self.options.reversed) {
					var pageIndex = (self.options.count % self.options.limit > 0) ? self.options.totalPages : self.options.totalPages + 1;
				} else {
					var pageIndex = 1;
				}
			}

			// page hasn't been loaded yet
			if (self.options.loadedPages.indexOf(pageIndex) < 0) {
				return (goToPage) ? self.goToPage(pageIndex) : self.loadPage(pageIndex);
			}

			if (!self.options.loadingPages[pageIndex]) {
				self.options.loadingPages[pageIndex] = elgg.ajax(self.getPageHref(pageIndex), {
					data: {
						controller: 'fetchNewItems',
						page_index: pageIndex,
						list_time: self.options.listTime,
						list_id: self.options.listId
					},
					beforeSend: function () {
						if (goToPage) {
							self.showLoader();
						}
					},
					dataType: 'html'
				});
			}
			self.options.loadingPages[pageIndex].then(function (data) {
				self.options.loadingPages[pageIndex] = null;
				self.addFetchedItems(data, pageIndex, goToPage);
				if (goToPage) {
					self.hideLoader();
				}
			});
		},
		addFetchedItems: function (responseData, pageIndex, goToPage) {
			var self = this,
					pageIndex = pageIndex;

			if (!pageIndex) {
				if (self.options.reversed) {
					var pageIndex = (self.options.count % self.options.limit > 0) ? self.options.totalPages : self.options.totalPages + 1;
				} else {
					var pageIndex = 1;
				}
			}

			var $newItems = self.parseNewItems(responseData);
			if (self.options.reversed) {
				// these go in the end of the list
				self.addPageItems(pageIndex, $newItems);
				var $pageItems = self.filterPageItems(pageIndex);
				if ($pageItems.length >= self.options.limit) {
					// possibly we have more new items
					self.fetchNewItems(pageIndex + 1, goToPage);
				}
			} else {
				var baseIndex = self.getPageOffset(pageIndex),
						$pageItems = self.filterPageItems(pageIndex),
						$firstPageItem = $pageItems.first(),
						itemIndex = 0;
				// these go in the beginning of the list
				$newItems.each(function (itIndex) {
					itemIndex = baseIndex + itIndex;
					$(this).data('item-index', itemIndex);
				});

				if ($firstPageItem.length) {
					$firstPageItem.before($newItems);
				} else {
					self.$list.html($newItems);
				}
				$newItems.last().nextAll().each(function () {
					var index = $(this).data('item-index');
					$(this).data('item-index', index + $newItems.length);
				});

				if ($newItems.length >= self.options.limit) {
					// possibly we have more new items
					self.fetchNewItems(pageIndex + 1, goToPage);
				}
			}

			self.options.count += $newItems.length;
			self.options.totalPages = Math.ceil(self.options.count / self.options.limit);

			if (goToPage) {
				self.goToPage(pageIndex);
				self.scrollToTop();
			}
			$(self).trigger('newItemsFetched', [pageIndex, $newItems]);
		},
		/**
		 * Process ajax response
		 *
		 * @param {integer} pageIndex    Page index
		 * @param {string}  responseData HTML string
		 * @returns {void}
		 */
		addPageOnLoad: function (pageIndex, responseData) {
			var self = this;
			self.options.loadedPages.push(pageIndex);
			var $newItems = self.parseNewItems(responseData).removeClass(self.options.classVisible).addClass(self.options.classHidden);
			if ($newItems.length) {
				self.addPageItems(pageIndex, $newItems);
			}
			$(self).trigger('pageLoaded', [pageIndex, responseData]);
		},
		/**
		 * Parse list items items from ajax response data
		 *
		 * @param {string} responseData
		 * @returns {jQuery}
		 */
		parseNewItems: function (responseData) {
			var self = this,
					$data = $(responseData),
					$list;

			if ($data.is('.elgg-list,.elgg-gallery')) {
				$list = $data;
			} else if ($data.is('.elgg-item')) {
				$list = $('<ul></ul>').html($data);
			} else if ($data.is('[data-list-id="' + self.options.listId + '"]')) {
				self.options.ajaxListData = $data.data();
				$list = $data.children('.elgg-list,.elgg-gallery');
			} else {
				$list = $data.find('[data-list-id="' + self.options.listId + '"]').first();
				self.options.ajaxListData = $list.data();
				$list = $list.children('.elgg-list,.elgg-gallery');
			}
			return $list.children().filter(function () {
				return !(self.$list.children().is('#' + $(this).attr('id')));
			});
		},
		/**
		 * Lazy load all pages
		 */
		lazyLoad: function () {
			var self = this,
					lazy = [],
					delta = 5;

			if (self.options.lazyLoad > 0) {
				delta = Math.ceil(self.options.lazyLoad / 2);

				var start = self.options.activePage - delta;
				start = start >= 1 ? start : 1;
				var end = self.options.activePage + delta;
				end = end <= self.options.totalPages ? end : self.options.totalPages;

				for (var index = start; index <= end; index++) {
					lazy.push(index);
				}
			}

			for (var i = 0; i < lazy.length; i++) {
				self.loadPage(lazy[i]);
			}
		},
		/**
		 * Rebuild pagination
		 * @returns {void}
		 */
		paginate: function () {
			var self = this;
			self.$pagination = self.$pagination.hypeListPagination(self.options, self.$elem);
			self.$pagination.each(function () {
				if (!$(this).children().length) {
					$(this).remove();
				}
			});
		},
		/**
		 * Get list items that belong to a page or a range of pages
		 *
		 * @param {int} startPageIndex Starting page number
		 * @param {int} endPageIndex   Ending page number
		 * @returns {jQuery[]}
		 */
		filterPageItems: function (startPageIndex, endPageIndex) {
			var self = this;
			endPageIndex = endPageIndex || startPageIndex;

			var start = self.getPageOffset(startPageIndex);
			var end = self.getPageOffset(endPageIndex) + self.getPageLimit(endPageIndex) - 1; // indexes start at 0

			return self.$list.children().filter(function () {
				var itemIndex = $(this).data('item-index');
				return itemIndex >= start && itemIndex <= end;
			});
		},
		/**
		 * Add items to the list and update indexes
		 *
		 * @param {int} pageIndex   Page number
		 * @param {jQuery} $items An array of <li> items
		 * @returns {void}
		 */
		addPageItems: function (pageIndex, $items) {
			var self = this,
					offset = self.filterPageItems(pageIndex).length, // offset index by the number of items already present on page
					baseIndex = self.getPageOffset(pageIndex), // item index in relation to all pages
					itemIndex = 0;

			if ($items.length) {
				$items.each(function (itIndex) {
					itemIndex = offset + baseIndex + itIndex;
					$(this).data('item-index', itemIndex);
					$(this).appendTo(self.$list);
				});
				self.sortList();
				$(self).trigger('itemsAdded');
			}
		},
		/**
		 * Remove items from the list
		 *
		 * @param {jQuery} $items
		 * @returns {void}
		 */
		removeItems: function ($items) {
			var self = this;
			var $itemsRemove = self.$list.find($items);

			if ($itemsRemove.length) {
				$itemsRemove.each(function () {
					$(this).nextAll().each(function () {
						var index = $(this).data('item-index');
						$(this).data('item-index', index - 1);
					});
					$(this).fadeOut().remove();
				});
				$(self).trigger('itemsRemoved');
			}
		},
		/**
		 * Sort list items by their index
		 * @returns {void}
		 */
		sortList: function () {
			var self = this,
					$children = self.$list.children(),
					length = $children.length,
					map = [];

			for (var i = 0; i < length; i++) {
				map.push({
					index: i,
					value: $($children[i]).data('item-index')
				});
			}
			map.sort(function (a, b) {
				return a.value - b.value;
			});

			for (i = 0; i < length; i++) {
				self.$list.append($children[map[i].index]);
			}
			$(self).trigger('listSorted');
		},
		/**
		 * Callback function for click event on selectorDelete
		 * @param {Object} e
		 * @returns {void}
		 */
		deleteItem: function (e) {
			if (e.isDefaultPrevented()) {
				return;
			}
			// the handler for default confirm has been killed in bindEvents
			if ($(this).is('[data-confirm],.elgg-requires-confirmation')) {
				var confirmText = $(this).data('confirm') || elgg.echo('question:areyousure');
				if (!confirm(confirmText)) {
					return false;
				}
			}
			var $elem = $(this),
					$list = $elem.closest('.elgg-list,.elgg-gallery'),
					$item = $elem.closest($elem.closest('.elgg-list,.elgg-gallery').children()),
					href = $elem.attr('href');

			if (href) {
				elgg.action($elem.attr('href'), {
					dataType: 'json',
					beforeSend: function () {
						$list.trigger('showLoader');
					},
					complete: function () {
						$list.trigger('hideLoader');
					},
					success: function (response) {
						if (response.status >= 0) {
							$list.hypeList('removeItems', $item);
						}
					}
				});
			} else {
				$elem.closest('.elgg-list,.elgg-gallery').hypeList('removeItems', $item);
			}
			// Doing a hard return
			// Element has been removed, so there is no reason for other handlers to do anything
			return false;
		},
		showLoader: spinner.start,
		hideLoader: spinner.stop
	};

	return hypeList;
});