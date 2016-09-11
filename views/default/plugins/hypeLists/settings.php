<?php

namespace hypeJunction\Lists;

$entity = elgg_extract('entity', $vars);

echo '<div>';
echo '<label>' . elgg_echo('lists:settings:pagination_type') . '</label>';
echo '<div class="elgg-text-help">' . elgg_echo('lists:settings:pagination_type:help') . '</div>';
echo elgg_view('input/dropdown', array(
	'name' => 'params[pagination_type]',
	'value' => $entity->pagination_type,
	'options_values' => array(
		'' => elgg_echo('lists:settings:pagination_type:off'),
		'default' => elgg_echo('lists:settings:pagination_type:default'),
		'infinite' => elgg_echo('lists:settings:pagination_type:infinite'),
	),
));

echo '</div>';

$sort_options = [
	'object' => [
		'time_created::desc',
		'time_created::asc',
		'last_action::asc',
		'last_action::desc',
		'alpha::asc',
		'alpha::desc',
		'likes_count::desc',
		'likes_count::asc',
		'responses_count::desc',
		'responses_count::asc',
	],
	'user' => [
		'alpha::asc',
		'alpha::desc',
		'time_created::asc',
		'time_created::desc',
		'friend_count::desc',
		'friend_count::asc',
		'last_action::asc',
		'last_action::desc',
	],
	'group' => [
		'alpha::asc',
		'alpha::desc',
		'time_created::asc',
		'time_created::desc',
		'member_count::desc',
		'member_count::asc',
		'last_action::asc',
		'last_action::desc',
	],
];

foreach ($sort_options as $entity_type => $options) {
	$checkboxes = '';
	foreach ($options as $option) {
		$input = elgg_view('input/checkbox', array(
			'type' => 'checkbox',
			'name' => "params[sort::$entity_type::$option]",
			'value' => 1,
			'checked' => ($entity->{"sort::$entity_type::$option"} == 1),
		));
		$label = elgg_format_element('label', [], $input . elgg_echo("sort:$entity_type:$option"));
		$checkboxes .= elgg_format_element('li', [], $label);
	}
	$list = elgg_format_element('ul', ['class' => 'elgg-checkboxes'], $checkboxes);
	echo elgg_view_module('aside', elgg_echo("sort:settings:$entity_type"), $list);
}
