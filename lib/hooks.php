<?php

namespace hypeJunction\Lists;

use Closure;

/**
 * Wrap list views into a container that can be manipulated
 *
 * @param string $hook   "view"
 * @param string $type   "page/components/list" or "page/components/gallery"
 * @param string $view   View
 * @param array  $params Hook params
 * @return string Wrapped view
 */
function wrap_list_view_hook($hook, $type, $view, $params) {
	
	$vars = elgg_extract('vars', $params);

	$pagination = elgg_extract('pagination', $vars, false);
	$pagination_type = elgg_extract('pagination_type', $vars, elgg_get_plugin_setting('pagination_type', 'hypeLists'));
	
	if (!$pagination || !$pagination_type) {
		return $view;
	}

	$no_results = elgg_extract('no_results', $vars, '');
	$no_results_str = ($no_results instanceof Closure) ? $no_results() : $no_results;
	
	$list_id = (isset($vars['list_id'])) ? $vars['list_id'] : '';
	if (!$list_id) {
		$list_id = md5(serialize(array(
			elgg_extract('container_class', $vars),
			elgg_extract('list_class', $vars),
			elgg_extract('item_class', $vars),
			$no_results_str,
			elgg_extract('pagination', $vars),
			elgg_extract('base_url', $vars),
		)));
	}

	$container_class = array_filter(array(
		'elgg-list-container',
		elgg_extract('container_class', $vars)
	));

	$wrapper_params = array(
		'class' => implode(' ', $container_class),
		'data-list-id' => $list_id,
		'data-base-url' => elgg_extract('base_url', $vars),
		'data-count' => elgg_extract('count', $vars, 0),
		'data-pagination' => $pagination_type,
		'data-pagination-position' => elgg_extract('position', $vars, ($pagination_type === 'infinite') ? 'both' : 'after'),
		'data-pagination-num-pages' => (int) elgg_extract('num_pages', $vars, 10),
		'data-text-no-results' => $no_results_str,
		'data-limit' => elgg_extract('limit', $vars, 10),
		'data-offset' => elgg_extract('offset', $vars, 0),
		'data-offset-key' => elgg_extract('offset_key', $vars, 'offset'),
		'data-lazy-load' => (int) elgg_extract('lazy_load', $vars, 6),
		'data-auto-refresh' => elgg_extract('auto_refresh', $vars, false),
		'data-reversed' => elgg_extract('reversed', $vars, false),
		'data-list-time' => get_input('list_time', time()),
	);

	foreach ($vars as $key => $val) {
		if (substr($key, 0, 5) === 'data-' && !array_key_exists($key, $wrapper_params)) {
			$wrapper_params[$key] = $val;
		}
	}
	
	elgg_require_js('framework/lists/init');
	return elgg_format_element('div', $wrapper_params, $view);
}