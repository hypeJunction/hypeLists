hypeLists
=========
![Elgg 1.9](https://img.shields.io/badge/Elgg-1.9.x-orange.svg?style=flat-square)
![Elgg 1.10](https://img.shields.io/badge/Elgg-1.10.x-orange.svg?style=flat-square)
![Elgg 1.11](https://img.shields.io/badge/Elgg-1.11.x-orange.svg?style=flat-square)
![Elgg 1.12](https://img.shields.io/badge/Elgg-1.12.x-orange.svg?style=flat-square)

A set of tools that improve UX and simplify common list patterns for developers.

### Features

- Seamless integration with core and existing plugins
- AJAXed list pagination and infinite scroll
- Lazy loading of preceeding and succeeding list pages
- Auto refreshing of lists


### Server-Side

The following options are accepted by ```elgg_list_entities()```, ```elgg_view_entity_list()```,
and by ```page/components/list``` and ```page/components/gallery``` views. These parameters will only take effect,
if you have ```'pagination' => true``` in your options. Additional options, that need to be passed to the jQuery plugin, can be prefixed with ```data-```

* ```'list_id'```          STRING is an optional parameter, but it is strongly recommended to pass it to your list. List id must be unique to the page.
* ```'pagination_type'```  STRING ```default``` (pagination bar with page number navigation) or ```infinite``` (before and after navigation)
* ```'position'```         STRING can be used to specify the position of pagination items. ```before```, ```after```, ```both```
* ```'num_pages'```        INT can be used to specify how many page number navigation items to show, use 0 to only show Next and Prev links
* ```'lazy_load'```        INT can be used to initialize lazy loading of pages
* ```'auto_refresh'```     INT can be used to specify at which interval in seconds new items should be fetched
* ```'reversed'```         BOOL can be used to specify reversed lists. If list is reversed, it is assumed that the new items will be located at the end of the list


### Client-Side

Lists that have received the necessary parameters server-side will be instantiated automatically. If you need to instantiate a list programmatically, use ```$.hypeList(options)```.

```js

// Instantiate a new list
$('.elgg-list.my-list').hypeList({
		baseUrl: false, // Data source
		count: 0, // Number of items in the list
		offset: 0, // Current offset from the beginning of the list
		offsetKey: 'offset', // Offset key
		limit: 10, // Number of items per page
		listId: '', // List identifier unique to the page
		pagination: 'default', // Pagination type: 'default', 'infinite'
		paginationPosition: 'after', // Pagination position: 'before', 'after', 'both'
		paginationNumPages: 10, // Number of page links to display in the pager
		classActive: 'elgg-state-selected', // CSS class pertinent to active elements
		classDisabled: 'elgg-state-disabled', // CSS class pertinent to disabled elements
		classLoading: 'elgg-state-loading', // CSS class pertinent to pending elements
		textNoResults: '', // Text displayed when no items were found in the list
		textNext: elgg.echo('next'), // Text for next link
		textPrev: elgg.echo('previous'), // Text for previous link
		keyTextBefore: 'lists:add:before', // Language key for before link (will receive limit as parameter)
		keyTextAfter: 'lists:add:after', // Language key for before link (will receive limit as parameter)
		lazyLoad: 10, // Number of pages to lazy load
		autoRefresh: 60, // Fetch new items at this interval (in seconds)
		reversed: false, // List is reversed that is new items are appended to the end of the list
		scrollTopOffset: -100, // Additional offset in pixels for when the page is scrolled to the top of the list
		listTime: 0, // Timestamp at which the list was generated, sent with AJAX requests
		showEffect: 'highlight', // jQuery UI effect used for toggling item visibility
		selectorDelete: '.elgg-menu-item-delete > a', // CSS selector of an anchor that will trigger a delete action
});

// Public methods

// Navigate to a page with a certain index
// For default pagination type, page with pageIndex is loaded and displayed
// For infinite pagination type, all pages in range from currently visible pages to the page with pageIndex are loaded and displayed
$('.elgg-list').hypeList('goToPage', pageIndex);

// Trigger refresh
// Reloads the page and appends new items if any
// If no pageIndex is provided, it's determined by pagination type
// goToPage parameter can be used to navigate to the page once new items have been fetched
// goToPage flag is useful when a new post was made and you want to display the post to the user
$('.elgg-list').hypeList('fetchNewItems', pageIndex, goToPage);

// Remove items from the list and reindex
$('.elgg-list').hypeList('removeItems', $items);

// Add new items to the list
$('.elgg-list').hypeList('addFetchedItems', ajaxData);

```






