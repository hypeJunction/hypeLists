<?php

namespace hypeJunction\Lists;

use ElggEntity;

class UserList extends EntityList {

	const ENTITY_TYPE = 'user';

	/**
	 * {@inheritdoc}
	 */
	public static function getEntityType() {
		return self::ENTITY_TYPE;
	}

	/**
	 * {@inheritdoc}
	 */
	public function getFilterOptions() {
		$options = $this->getOptions();

		$filter_options = array(
			'',
		);

		if (elgg_is_logged_in()) {
			$filter_options[] = 'friend';
			$filter_options[] = 'non_friend';
		}

		$params = [
			'list' => $this,
		];

		$filter_options = elgg_trigger_plugin_hook('sort_relationships', 'user', $params, $filter_options);

		$subtypes = elgg_extract('subtype', $options);
		if (!$subtypes) {
			$subtypes = elgg_extract('subtypes', $options);
		}

		if (!empty($subtypes)) {
			$subtypes = (array) $subtypes;
			$subtype = $subtypes[0];
			$filter_options = elgg_trigger_plugin_hook('sort_relationships', "user:$subtype", $params, $filter_options);
		}

		return $filter_options;
	}

	/**
	 * {@inheritdoc}
	 */
	public static function addSortQuery(array $options = [], $field = 'time_created', $direction = 'DESC') {

		$dbprefix = elgg_get_config('dbprefix');

		$order_by = explode(',', elgg_extract('order_by', $options, ''));
		array_walk($order_by, 'trim');

		$options['joins']['users_entity'] = "
			JOIN {$dbprefix}users_entity users_entity
				ON users_entity.guid = e.guid
			";

		switch ($field) {

			case 'type' :
			case 'subtype' :
			case 'guid' :
			case 'owner_guid' :
			case 'container_guid' :
			case 'site_guid' :
			case 'enabled' :
			case 'time_created';
			case 'time_updated' :
			case 'access_id' :
				array_unshift($order_by, "e.{$field} {$direction}");
				break;

			case 'last_action' :
				$options['selects']['last_action'] = "
					GREATEST(e.time_created, e.last_action, e.time_updated, users_entity.last_login)
						AS last_action
					";
				array_unshift($order_by, "last_action {$direction}");
				break;

			case 'name' :
			case 'username' :
			case 'email' :
			case 'language' :
			case 'banned' :
			case 'admin' :
			case 'last_login' :
				array_unshift($order_by, "users_entity.{$field} {$direction}");
				break;


			case 'friend_count' :
				$options['joins']['friend_count'] = "
					LEFT JOIN {$dbprefix}entity_relationships friend_count
						ON friend_count.guid_one = e.guid
						AND friend_count.relationship = 'friend'
					";
				$options['selects']['friend_count'] = "
					COUNT(friend_count.guid_two)
						AS friend_count
					";
				$options['group_by'] = 'e.guid';

				array_unshift($order_by, "friend_count {$direction}");
				$order_by[] = 'e.time_created DESC'; // show newest first if count is the same
				break;
		}

		if ($field == 'alpha') {
			array_unshift($order_by, "users_entity.name {$direction}");
		} else {
			// Always order by name for matching fields
			$order_by[] = "users_entity.name ASC";
		}

		$options['order_by'] = implode(', ', array_unique(array_filter($order_by)));

		$params = array(
			'field' => $field,
			'direction' => $direction,
		);

		return elgg_trigger_plugin_hook('sort_options', 'user', $params, $options);
	}

	/**
	 * {@inheritdoc}
	 */
	public static function addSearchQuery(array $options = [], $query = '', array $search_options = []) {

		if (!$query) {
			return $options;
		}

		$query = sanitize_string(stripslashes($query));

		$dbprefix = elgg_get_config('dbprefix');

		$options['joins']['users_entity'] = "
			JOIN {$dbprefix}users_entity users_entity
				ON users_entity.guid = e.guid
			";

		$advanced = false;
		$attribute_names = ['name', 'username'];

		if (isset($search_options['fields'])) {
			$search_fields = elgg_extract('fields', $search_options);

			$attribute_fields = [];
			$metadata_fields = [];

			foreach ($search_fields as $search_field) {
				if (in_array($search_field, $attribute_names)) {
					$attribute_fields[] = $search_field;
				} else {
					$metadata_fields[] = $search_field;
					$advanced = true;
				}
			}
		} else {
			$attribute_fields = $attribute_names;
			$tag_names = (array) elgg_get_registered_tag_metadata_names();
			$profile_field_names = array_keys((array) elgg_get_config('profile_fields'));
			$metadata_fields = array_unique($tag_names + $profile_field_names);
			$metadata_fields = array_diff($metadata_fields, $attribute_fields);
			$advanced = elgg_extract('advanced', $search_options, false);
		}

		if (empty($attribute_fields)) {
			$attribute_fields = ['name'];
		}

		$where = self::getFieldSearchWhereClause('users_entity', $attribute_fields, ['query' => $query], false);

		if ($advanced && !empty($metadata_fields)) {
			$options['joins']['metadata_fields_md'] = "
				JOIN {$dbprefix}metadata metadata_fields_md
					ON e.guid = metadata_fields_md.entity_guid
				";
			$options['joins']['metadata_fields_msv'] = "
				JOIN {$dbprefix}metastrings metadata_fields_msv
					ON n_table.value_id = metadata_fields_msv.id
				";

			$clauses = _elgg_entities_get_metastrings_options('metadata', array(
				'metadata_names' => $metadata_fields,
				'metadata_values' => null,
				'metadata_name_value_pairs' => null,
				'metadata_name_value_pairs_operator' => null,
				'metadata_case_sensitive' => null,
				'order_by_metadata' => null,
				'metadata_owner_guids' => null,
			));

			$options['joins'] = array_merge($clauses['joins'], $options['joins']);
			$metadata_fields_md_where = "(({$clauses['wheres'][0]}) AND metadata_fields_msv.string LIKE '%$query%')";

			$options['wheres'][] = "(($where) OR ($metadata_fields_md_where))";
		} else {
			$options['wheres'][] = "$where";
		}

		return $options;
	}

	/**
	 * {@inheritdoc}
	 */
	public static function addFilterQuery(array $options = [], $filter = '', ElggEntity $target = null) {

		if (!isset($target)) {
			$target = elgg_get_logged_in_user_entity();
		}

		$dbprefix = elgg_get_config('dbprefix');

		$guid = (int) $target->guid;

		switch ($filter) {

			case 'not_self' :
				$options['wheres']['filter_not_self'] = "e.guid != $guid";
				break;

			case 'friend' :
				$options['wheres']['filter_friend'] = "
					EXISTS (SELECT 1 FROM {$dbprefix}entity_relationships
						WHERE guid_one = $guid
							AND relationship = 'friend'
							AND guid_two = e.guid)
					";
				break;

			case 'friend_of' :
				$options['wheres']['filter_friend'] = "
					EXISTS (SELECT 1 FROM {$dbprefix}entity_relationships
						WHERE guid_one = e.guid
							AND relationship = 'friend'
							AND guid_two = $guid)
					";
				break;

			case 'non_friend' :
				$options['wheres']['filter_non_friend'] = "
					NOT EXISTS (SELECT 1 FROM {$dbprefix}entity_relationships
						WHERE guid_one = $guid
							AND relationship = 'friend'
							AND guid_two = e.guid)
					";
				break;

			case 'member' :
				$options['wheres']['filter_member'] = "
					EXISTS (SELECT 1 FROM {$dbprefix}entity_relationships
						WHERE guid_one = e.guid
							AND relationship = 'member'
							AND guid_two = $guid)
					";
				break;

			case 'non_member' :
				$options['wheres']['filter_member'] = "
					NOT EXISTS (SELECT 1 FROM {$dbprefix}entity_relationships
						WHERE guid_one = e.guid
							AND relationship = 'member'
							AND guid_two = $guid)
					";
				break;

			case 'online' :
				$time = time() - 600;
				$options['wheres'][] = "users_entity.last_action >= $time";
				break;
		}

		$params = array(
			'filter' => $filter,
			'target' => $target,
			// BC
			'rel' => $filter,
			'page_owner' => $target,
		);

		$options = elgg_trigger_plugin_hook('rel_options', 'user', $params, $options); // BC hook
		$options = elgg_trigger_plugin_hook('filter_options', 'user', $params, $options);

		return $options;
	}

}
