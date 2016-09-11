<?php

/**
 * Render a sortable list of entities
 *
 * @uses $vars['options']         Options to pass to elgg_list_entities()
 * @uses $vars['show_search']     Dispay a search form
 * @uses $vars['query']           Current search query
 * @uses $vars['show_filter']     Display a filter toggler
 * @uses $vars['filter_options']  A list of filter options to show in the form
 * @uses $vars['filter']          Enabled filter
 * @uses $vars['show_sort']       Display a sort toggle
 * @uses $vars['sort_options']    A list of sort options to show in the form
 * @uses $vars['sort']            Enabled sort (e.g. alpha::asc or time_created::desc)
 * $uses $vars['show_subtype']    Show subtype picker
 * @uses $vars['subtype_options'] Subtype options
 * @uses $vars['entity_subtype']  Selected subtype
 * @uses $vars['group']           Group entity (for filtering)
 */
$user_list = new \hypeJunction\Lists\UserList();

unset($vars['callback']); // BC junk

$options = (array) elgg_extract('options', $vars);
unset($vars['options']);

$filter = elgg_extract('filter', $vars, get_input('filter'));
unset($vars['filter']);

$query = elgg_extract('query', $vars, get_input('query'));
unset($vars['query']);

$sort = elgg_extract('sort', $vars, get_input('sort', 'alpha::asc'));
unset($vars['sort']);

$target = elgg_extract('group', $vars, elgg_get_page_owner_entity());
unset($vars['group']);
if (!$target) {
	$target = elgg_get_logged_in_user_entity();
}

$subtype = elgg_extract('entity_subtype', $vars, get_input('entity_subtype'));
if (!in_array($subtype, $user_list->getSubtypeOptions())) {
	$subtype = null;
}

$options = array_merge($vars, $options);
if ($subtype) {
	unset($options['subtype']);
	$options['subtypes'] = $subtype;
}

if (!isset($options['show_search'])) {
	$options['show_search'] = true;
}
if (!isset($options['show_sort'])) {
	$options['show_sort'] = true;
}

list($sort_field, $sort_direction) = explode('::', $sort);

$user_list->setOptions($options)
->addSort($sort_field, $sort_direction)
->addFilter($filter, $target)
->setQuery($query);

echo $user_list->render();


