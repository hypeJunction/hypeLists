<?php

/**
 * hypeLists
 * Developer tools for managing and ajaxifying lists
 *
 * @package    Elgg
 * @subpackage hypeJunction\Lists
 *
 * @author      Ismayil Khayredinov <ismayil@hypejunction.com>
 * @copyright   Copyright (c) 2014 Ismayil Khayredinov
 *
 * hypeLists is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License version 2, as published by the
 * Free Software Foundation.
 *
 * You may NOT assume that you can use any other version of the GPL.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details
 *
 * You should have received a copy of the GNU General Public License along with
 * this program; if not, it can be found here:
 * http://www.gnu.org/licenses/gpl-2.0.html
 */

namespace hypeJunction\Lists;

if (file_exists(__DIR__  . '/vendor/autoload.php')) {
	require_once __DIR__ . '/vendor/autoload.php';
}

require_once __DIR__ . '/lib/hooks.php';

elgg_register_event_handler('init', 'system', __NAMESPACE__ . '\\init');
elgg_register_event_handler('pagesetup', 'system', __NAMESPACE__ . '\\register_view_hook_handlers');

/**
 * Initialize the plugin
 * @return void
 */
function init() {

	elgg_define_js('hypeList', array(
		'src' => '/mod/hypeLists/vendors/hypeJunction/hypeList.js',
		'deps' => array('jquery', 'elgg'),
	));

	elgg_extend_view('css/elgg', 'css/framework/lists/stylesheet.css');
}

/**
 * Register list-like views to be wrapped for ajax pagination
 * @return void
 */
function register_view_hook_handlers() {
	
	$defaults = array(
		'page/components/list',
		'page/components/gallery',
		'page/components/ajax_list',
	);
	
	$views = elgg_trigger_plugin_hook('get_views', 'framework:lists', null, $defaults);
	foreach ($views as $view) {
		elgg_register_plugin_hook_handler('view', $view, __NAMESPACE__ . '\\wrap_list_view_hook');
	}
}
