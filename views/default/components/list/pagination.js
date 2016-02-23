define(function (require) {

	var elgg = require('elgg');
	var $ = require('jquery');
	var hypeList = require('components/list/list');
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
		/**
		 * Check if method is public
		 *
		 * @param {string} method Method name
		 * @returns {array}
		 */
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
					delta = 2;
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
				
				if (start >= 3) {
					$paginationItems = $paginationItems.add(self.buildPaginationItem('', 1, false, false));
					if (start === 3) {
						$paginationItems = $paginationItems.add(self.buildPaginationItem('', 2, false, false));
					} else {
						$paginationItems = $paginationItems.add(self.buildPaginationItem('ellipsis', -1, false, true));
					}
				}

				for (var i = 0; i < pages.length; i++) {
					$paginationItems = $paginationItems.add(self.buildPaginationItem('', pages[i], self.options.activePage === pages[i], false));
				}

				if (end <= self.options.totalPages - 2) {
					if (end === self.options.totalPages - 2) {
						$paginationItems = $paginationItems.add(self.buildPaginationItem('', self.options.totalPages - 1, false, false));
					} else {
						$paginationItems = $paginationItems.add(self.buildPaginationItem('ellipsis', -1, false, true));
					}
					$paginationItems = $paginationItems.add(self.buildPaginationItem('', self.options.totalPages, false, false));
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
				case 'ellipsis' :
					itemText = '...';
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
	return hypeListPagination;
});