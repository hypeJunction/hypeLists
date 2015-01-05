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
