(function (factory) {
	if (typeof define === 'function' && define.amd) {
		define(['jquery', 'elgg'], factory);
	} else {
		factory(jQuery, elgg);
	}
}(function ($, elgg) {
	'use strict';

	// Default options
	var defaults = {
		baseUrl: false, // Data source
		count: 0, // Number of items in the list
		offset: 0, // Current offset from the beginning of the list
		offsetKey: 'offset', // Offset key
		limit: 10, // Number of items per page
		listId: '', // List identifier unique to the page
		pagination: 'default', // Pagination type: 'default', 'infinite'
		paginationPosition: 'after', // Pagination position: 'before', 'after', 'both'
		paginationNumPages: 10, // Number of page links to display in the pager
		classActive: 'elgg-state-selected', // CSS class for active elements
		classDisabled: 'elgg-state-disabled', // CSS class for disabled elements
		classLoading: 'elgg-state-loading', // CSS class for loading elements
		classVisible: 'elgg-discoverable', // CSS class for visible elements
		classHidden: 'hidden', // CSS class for hidden elements
		textNoResults: '', // Text displayed when no items were found in the list
		textNext: elgg.echo('next'), // Text for next link
		textPrev: elgg.echo('previous'), // Text for previous link
		keyTextBefore: 'lists:load:before', // Language key for before link (will receive limit as parameter)
		keyTextAfter: 'lists:load:after', // Language key for before link (will receive limit as parameter)
		keyTextRemaining: 'lists:load:remaining', // Language key for show remaining items link
		lazyLoad: 0, // Number of pages to lazy load
		autoRefresh: false, // Fetch new items at this interval (in seconds)
		reversed: false, // List is reversed that is new items are appended to the end of the list
		scrollTopOffset: -100, // Additional offset in pixels for when the page is scrolled to the top of the list
		listTime: 0, // Timestamp at which the list was generated, sent with AJAX requests
		selectorDelete: '.elgg-menu-item-delete > a', // CSS selector of an anchor that will trigger a delete action
	};

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

			self.$pagination = self.$list.siblings('.elgg-pagination').show();
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
			$(self).on('pageSwitched.hypeList newItemsFetched.hypeList', self.scrollToTop);
			$(self).on('ready.hypeList newItemsFetched.hypeList', self.setRefreshTimeout);
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
			self.timeout = setTimeout(function () {
				self.fetchNewItems.apply(self, []);
			}, self.options.autoRefresh * 1000);
		},
		/**
		 * Trigger init event
		 * @returns {void}
		 */
		init: function () {
			var self = this;
			$(self).trigger('ready');
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
			$pageItems.removeClass(self.options.classHidden).addClass(self.options.classVisible);
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
			if ($items.length) {
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
		 * @param {Function} callback  Callback function
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
						dataType: 'html',
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

			self.showLoader();
			self.loadPage(pageIndex, null, function (pageIndex) {
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
					self.loadPage(i, null, function (i) {
						self.options.visiblePages.push(i);
					});
				}
			} else {
				for (var i = Math.min.apply(null, self.options.visiblePages); i >= pageIndex; i--) {
					self.loadPage(i, null, function (i) {
						self.options.visiblePages.push(i);
					});
				}
			}

			self.loadPage(pageIndex, function () {
				self.showLoader();
			}, function (pageIndex) {
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
					dataType: 'html',
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

				$firstPageItem.before($newItems);
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
				$list = $data.children('.elgg-list,.elgg-gallery');
			} else {
				$list = $data.find('[data-list-id="' + self.options.listId + '"]').first();
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
					if (self.options.selectorDelete) {
						$(this).find(self.options.selectorDelete).off('click').on('click', self.deleteItem);
					}
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
			e.preventDefault();
			if (!$(this).is('*[data-confirm],.elgg-requires-confirmation')) {
				var confirmText = $(this).data('confirm') || elgg.echo('question:areyousure');
				if (!confirm(confirmText)) {
					return false;
				}
			}
			var $elem = $(this),
					$item = $elem.closest($elem.closest('.elgg-list,.elgg-gallery').children()),
					href = $elem.attr('href');

			if (href) {
				elgg.action($elem.attr('href'), {
					dataType: 'json',
					success: function (response) {
						if (response.status >= 0) {
							$elem.closest('.elgg-list,.elgg-gallery').hypeList('removeItems', $item);
						}
					}
				});
			} else {
				$elem.closest('.elgg-list,.elgg-gallery').hypeList('removeItems', $item);
			}
		},
		showLoader: function () {
			$('body').addClass(this.options.classLoading);
		},
		hideLoader: function () {
			$('body').removeClass(this.options.classLoading)
		}
	};

	/**
	 * hypeListPagination constructor
	 * Inherits from hypeList constructor
	 * 
	 * @param {object} element    DOM Element
	 * @param {object} options    Options
	 * @param {jQuery} $list hypeList container
	 * @returns {hypeListPagination}
	 */
	var hypeListPagination = function (element, options, $list) {
		var self = this;
		hypeList.call(self, element, options);
		self.$list = $list;
	};

	/**
	 * Extended hypeListPagination prototype
	 */
	hypeListPagination.prototype = $.extend(Object.create(hypeList.prototype), {
		/**
		 * hypeListPagination constructor definition
		 */
		constructor: hypeListPagination,
		isPublicMethod: function (method) {
			return ['init'].indexOf(method) >= 0;
		},
		/**
		 * Override hypeList.prepareDom()
		 * @returns {void}
		 */
		prepareDom: function () {
		},
		/**
		 * Initialize pagination
		 * @returns {void}
		 */
		init: function () {

			var self = this,
					pages = [],
					delta = 5;

			self.$elem.children().remove();

			if (self.options.count <= self.options.limit) {
				return;
			}

			var $paginationItems = $();

			if (self.options.paginationNumPages > 0) {
				delta = Math.ceil(self.options.paginationNumPages / 2);

				var start = self.options.activePage - delta - 1;
				start = start >= 1 ? start : 1;
				var end = self.options.activePage + delta;
				end = end <= self.options.totalPages ? end : self.options.totalPages;

				for (var index = start; index <= end; index++) {
					pages.push(index);
				}
			}

			if (self.options.pagination === 'infinite') {
				if (self.$elem.data('position') === 'before') {
					var start = Math.min.apply(null, self.options.visiblePages);
					var before = start >= 1 ? start - 1 : 1;
					$paginationItems = $paginationItems.add(self.buildPaginationItem('before', before, false, before < 1));
				} else {
					var end = Math.max.apply(null, self.options.visiblePages);
					var after = end <= self.options.totalPages ? end + 1 : self.options.totalPages;
					$paginationItems = $paginationItems.add(self.buildPaginationItem('after', after, false, after > self.options.totalPages));
				}
			} else {
				var prev = self.options.activePage > 1 ? self.options.activePage - 1 : 1;
				$paginationItems = $paginationItems.add(self.buildPaginationItem('prev', prev, false, self.options.activePage === 1));

				for (var i = 0; i < pages.length; i++) {
					$paginationItems = $paginationItems.add(self.buildPaginationItem('', pages[i], self.options.activePage === pages[i], false));
				}

				var next = self.options.activePage < self.options.totalPages ? self.options.activePage + 1 : self.options.totalPages;
				$paginationItems = $paginationItems.add(self.buildPaginationItem('next', next, false, self.options.activePage === self.options.totalPages));
			}

			self.$elem.append($paginationItems);
			self.bindEvents();
		}
		,
		/**
		 * Build pagination item wrapped in <li></li>
		 *
		 * @param {string}  type      Item type: '', 'next', 'prev', 'after', or 'before'
		 * @param {integer} pageIndex Page index
		 * @param {bool}    active    Is an active (current) page
		 * @param {bool}    disabled  Is a disabled (unavailable, current) page
		 * @returns {jQuery}
		 */
		buildPaginationItem: function (type, pageIndex, active, disabled) {

			var self = this;
			var $itemContainer = $('<li></li>'),
					$itemContent = (active || disabled) ? $('<span></span>') : $('<a></a>'),
					text = '',
					itemText = null,
					callback = 'goToPage',
					attr = {href: (active || disabled) ? null : self.getPageHref(pageIndex)};
			switch (type) {
				case 'prev' :
					itemText = self.options.textPrev;
					attr.rel = 'prev';
					attr.class = 'elgg-prev';
					break;
				case 'next' :
					itemText = self.options.textNext;
					attr.rel = 'next';
					attr.class = 'elgg-next';
					break;
				case 'before' :
					text = (pageIndex === 1 || pageIndex === self.options.totalPages) ?
							elgg.echo(self.options.keyTextRemaining) :
							elgg.echo(self.options.keyTextBefore, [self.options.limit]);
					itemText = (active || disabled) ? null : text;
					attr.rel = 'prev';
					attr.class = 'elgg-before';
					break;
				case 'after' :
					text = (pageIndex === 1 || pageIndex === self.options.totalPages) ?
							elgg.echo(self.options.keyTextRemaining) :
							elgg.echo(self.options.keyTextAfter, [self.options.limit]);
					itemText = (active || disabled) ? null : text;
					attr.rel = 'prev';
					attr.class = 'elgg-after';
					break;
				default :
					itemText = pageIndex;
					break;
			}

			if (itemText) {
				$itemContent.html(itemText).attr(attr);
				$itemContainer.toggleClass(self.options.classActive, active)
						.toggleClass(self.options.classDisabled, disabled)
						.data('page-index', pageIndex)
						.data('callback', callback)
						.append($itemContent);
			} else {
				$itemContainer = $();
			}

			return $itemContainer;
		},
		/**
		 * Bind events to pagination items
		 * @returns {void}
		 */
		bindEvents: function () {
			var self = this;

			self.$elem.find('li').each(function () {
				var $elem = $(this);
				$elem.off('click.hypeList');
				if ($elem.hasClass(self.options.classDisabled)
						|| $elem.hasClass(self.options.classActive
								|| $elem.hasClass(self.options.classLoading))) {
					$elem.on('click.hypeList', function (e) {
						e.preventDefault();
					});
					return;
				}
				$elem.on('click.hypeList', function (e) {
					e.preventDefault();
					$(this).addClass(self.options.classLoading);
					var callback = $(this).data('callback');
					var index = parseInt($(this).data('page-index'), 10);
					self[callback].apply(self, [index]);
				});
			});
		},
		/**
		 * Switch to a different page
		 *
		 * @param {integer} pageIndex Page index number
		 * @returns {void}
		 */
		goToPage: function (pageIndex) {
			this.$list.hypeList('goToPage', pageIndex);
		}
	});

	/**
	 * hypeList() jQuery plugin
	 *
	 * @param {mixed} option Method name or options
	 * @returns {array}
	 */
	$.fn.hypeList = function (option) {

		var options = typeof option === 'object' && option || {};
		var args = Array.prototype.slice.call(arguments, 1);

		return this.each(function () {
			var opts = $.extend(true, {}, defaults, options);
			var data = $(this).data('hypeList');
			if (!data) {
				data = new hypeList(this, opts);
				data.init.apply(data, args);
			}
			if (typeof option === 'string' && data.isPublicMethod(option)) {
				data[option].apply(data, args);
			}
			$(this).data('hypeList', data);
		});
	};

	/**
	 * hypeListPagination() jQuery plugin
	 *
	 * @param {object} options Pagination options
	 * @param {jQuery} $list   List that this pagination belongs to
	 * @returns {}
	 */
	$.fn.hypeListPagination = function (options, $list) {
		options = $.extend(true, {}, defaults, options);
		return this.each(function () {
			if (!$list.length) {
				$list = $(this).siblings('.elgg-list,.elgg-gallery');
			}
			options = $.extend(true, {}, options, $(this).data());
			var data = $(this).data('hypeListPagination');
			if (!data) {
				data = new hypeListPagination(this, options, $list);
			} else {
				data.options = options;
			}
			data.init();
			$(this).data('hypeListPagination', data);
		});
	};

	/**
	 * Expose constructors and defaults to jQuery plugins
	 */
	$.fn.hypeList.defaults = defaults;
	$.fn.hypeList.hypeList = hypeList;
	$.fn.hypeListPagination.defaults = defaults;
	$.fn.hypeListPagination.hypeListPagination = hypeListPagination;
}));
