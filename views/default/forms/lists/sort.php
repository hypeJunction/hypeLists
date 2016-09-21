<?php
/**
 * Displays a sort/search form
 */
$entity_type = elgg_extract('entity_type', $vars, 'object');

$fields = '';

if (elgg_extract('show_subtype', $vars, false)) {
	$subtypes = elgg_extract('subtype_options', $vars);
	if (!empty($subtypes)) {
		$subtype_options_values = array('' => elgg_echo("sort:$entity_type:subtype:all"));
		foreach ($subtypes as $subtype) {
			$subtype_options_values[$subtype] = elgg_echo("item:$entity_type:$subtype");
		}
		$subtype_value = elgg_extract('subtype', $vars, '');
		if (is_array($subtype_value) && sizeof($subtype_value) > 1) {
			$subtype_value = '';
		}
		$fields .= elgg_view_input('select', array(
			'name' => 'entity_subtype',
			'value' => $subtype_value,
			'options_values' => $subtype_options_values,
			'class' => 'elgg-sortable-list-select',
			'label' => elgg_echo("sort:$entity_type:subtype:label"),
			'field_class' => 'elgg-sortable-list-select-field',
		));
	}
}

if (elgg_extract('show_filter', $vars, false)) {
	$filter_options = elgg_extract('filter_options', $vars);
	if (!empty($filter_options)) {
		$filter_options_values = array();
		foreach ($filter_options as $filter_option) {
			$filter_options_values[$filter_option] = elgg_echo("sort:$entity_type:filter:$filter_option");
		}
		$fields .= elgg_view_input('select', array(
			'name' => 'filter',
			'value' => elgg_extract('filter', $vars, ''),
			'options_values' => $filter_options_values,
			'class' => 'elgg-sortable-list-select',
			'label' => elgg_echo("sort:$entity_type:filter:label"),
			'field_class' => 'elgg-sortable-list-select-field',
		));
	}
}

if (elgg_extract('show_search', $vars, false)) {
	$fields .= elgg_view_input('text', array(
		'name' => 'query',
		'value' => elgg_extract('query', $vars),
		'class' => 'elgg-sortable-list-query',
		'label' => elgg_echo("sort:$entity_type:search:label"),
		'field_class' => 'elgg-sortable-list-query-field',
		'placeholder' => elgg_echo("sort:$entity_type:search:placeholder"),
	));
}

if (elgg_extract('show_sort', $vars, false)) {
	$sort_options = elgg_extract('sort_options', $vars);
	if (!empty($sort_options)) {
		$sort_options_values = array();
		foreach ($sort_options as $sort_option) {
			$sort_options_values[$sort_option] = elgg_echo("sort:$entity_type:$sort_option");
		}
		$fields .= elgg_view_input('select', array(
			'name' => 'sort',
			'value' => elgg_extract('sort', $vars, 'time_created::desc'),
			'options_values' => $sort_options_values,
			'class' => 'elgg-sortable-list-select',
			'label' => elgg_echo("sort:$entity_type:label"),
			'field_class' => 'elgg-sortable-list-select-field',
		));
	}
}

if (!$fields) {
	return;
}

if (elgg_extract('expand_form', $vars, true)) {
	echo elgg_format_element('div', [
		'class' => 'elgg-sortable-list-fieldset',
	], $fields);
} else {
	echo elgg_view('output/url', [
		'href' => '#',
		'text' => elgg_view_icon('filter') . elgg_echo('sort:menu:filter'),
		'class' => 'elgg-sortable-list-form-toggle',
	]);
	
	echo elgg_format_element('div', [
		'class' => 'elgg-sortable-list-fieldset hidden',
	], $fields);
}


echo elgg_view_input('hidden', [
	'name' => 'entity_type',
	'value' => $entity_type,
]);

echo elgg_view_input('submit', [
	'class' => 'hidden',
	'field_class' => 'hidden',
]);
?>
<script>
	require(['forms/lists/sort']);
</script>