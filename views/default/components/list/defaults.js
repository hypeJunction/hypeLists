define(function (require) {
	var elgg = require('elgg');
	return {
		baseUrl: false, // Data source
		count: 0, // Number of items in the list
		offset: 0, // Current offset from the beginning of the list
		offsetKey: 'offset', // Offset key
		limit: 10, // Number of items per page
		listId: '', // List identifier unique to the page
		pagination: 'default', // Pagination type: 'default', 'infinite'
		paginationPosition: 'after', // Pagination position: 'before', 'after', 'both'
		paginationNumPages: 5, // Number of page links to display in the pager
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
		listClasses: 'elgg-list'
	};
});