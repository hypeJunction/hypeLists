define('hypeList', [
	'jquery',
	'elgg',
	'components/list/defaults',
	'components/list/list',
	'components/list/pagination',
	'elgg/spinner'
], function ($, elgg, defaults, hypeList, hypeListPagination) {

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

});