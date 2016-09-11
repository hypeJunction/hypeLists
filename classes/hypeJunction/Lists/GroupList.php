<?php

namespace hypeJunction\Lists;

use ElggEntity;

class GroupList extends EntityList {

	const ENTITY_TYPE = 'group';

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
			'open',
			'closed',
			'featured',
		);

		if (elgg_is_logged_in()) {
			$filter_options[] = 'member';
			if (elgg_get_plugin_setting('limited_groups', 'groups') != 'yes' || elgg_is_admin_logged_in()) {
				$filter_options[] = 'admin';
			}
			$filter_options[] = 'invited';
			$filter_options[] = 'membership_request';
		}

		$params = [
			'list' => $this,
		];

		$filter_options = elgg_trigger_plugin_hook('sort_relationships', 'group', $params, $filter_options);

		$subtypes = elgg_extract('subtype', $options);
		if (!$subtypes) {
			$subtypes = elgg_extract('subtypes', $options);
		}

		if (!empty($subtypes)) {
			$subtypes = (array) $subtypes;
			$subtype = $subtypes[0];
			$filter_options = elgg_trigger_plugin_hook('sort_relationships', "group:$subtype", $params, $filter_options);
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

		$options['joins']['groups_entity'] = "
			JOIN {$dbprefix}groups_entity groups_entity
				ON groups_entity.guid = e.guid
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
					GREATEST(e.time_created, e.last_action, e.time_updated, groups_entity.last_login)
						AS last_action
					";
				array_unshift($order_by, "last_action {$direction}");
				break;

			case 'name' :
			case 'description' :
				array_unshift($order_by, "groups_entity.{$field} {$direction}");
				break;

			case 'last_action' :
				$options['selects']['last_action'] = "
					GREATEST (e.time_created, e.last_action, e.time_updated) AS last_action
					";
				array_unshift($order_by, "last_action {$direction}");
				break;

			case 'member_count' :
				$options['joins']['member_count'] = "
					LEFT JOIN {$dbprefix}entity_relationships AS member_count
						ON member_count.guid_two = e.guid
						AND member_count.relationship = 'member'
					";
				$options['selects']['member_count'] = "COUNT(member_count.guid_one) as member_count";
				$options['group_by'] = 'e.guid';

				array_unshift($order_by, "member_count {$direction}");
				$order_by[] = 'e.time_created DESC'; // show newest first if count is the same
				break;
		}

		if ($field == 'alpha') {
			array_unshift($order_by, "groups_entity.name {$direction}");
		} else {
			// Always order by name for matching fields
			$order_by[] = "groups_entity.name ASC";
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

		$options['joins']['groups_entity'] = "
			JOIN {$dbprefix}groups_entity groups_entity
				ON groups_entity.guid = e.guid
			";

		$advanced = false;
		$attribute_names = ['name', 'description'];

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
			$profile_field_names = array_keys((array) elgg_get_config('group'));
			$metadata_fields = array_unique($tag_names + $profile_field_names);
			$metadata_fields = array_diff($metadata_fields, $attribute_fields);
			$advanced = elgg_extract('advanced', $search_options, false);
		}

		if (empty($attribute_fields)) {
			$attribute_fields = ['name'];
		}

		$where = self::getFieldSearchWhereClause('groups_entity', $attribute_fields, ['query' => $query], false);

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

			case 'closed' :
			case 'open' :
				$name_id = elgg_get_metastring_id('membership');
				$value_id = elgg_get_metastring_id(ACCESS_PUBLIC);
				$operand = $filter == 'open' ? '=' : '!=';
				$options['wheres']['membership_md'] = "EXISTS (SELECT 1 FROM {$dbprefix}metadata
				WHERE entity_guid = e.guid AND name_id = $name_id AND value_id $operand $value_id)";
				break;

			case 'featured' :
				$name_id = elgg_get_metastring_id('featured_group');
				$value_id = elgg_get_metastring_id('yes');
				$options['wheres']['featured_md'] = "EXISTS (SELECT 1 FROM {$dbprefix}metadata
				WHERE entity_guid = e.guid AND name_id = $name_id AND value_id = $value_id)";
				break;

			case 'member' :
				$options['wheres']['member_rel'] = "
						EXISTS (SELECT 1 FROM {$dbprefix}entity_relationships
							WHERE guid_one = $guid
								AND relationship = 'member'
								AND guid_two = e.guid)
						";
				break;

			case 'admin' :
				$options['wheres']['admin_rel'] = "
						(e.owner_guid = $guid
							OR EXISTS (SELECT 1 FROM {$dbprefix}entity_relationships
								WHERE guid_one = $guid
									AND relationship = 'group_admin'
									AND guid_two = e.guid))
							";
				break;

			case 'invited' :
				$options['wheres']['invited_rel'] = "
						EXISTS (SELECT 1 FROM {$dbprefix}entity_relationships
							WHERE guid_two = $guid
								AND relationship = 'invited'
								AND guid_one = e.guid)
						";
				break;

			case 'membership_request' :
				$options['wheres']['membership_request_rel'] = "
						EXISTS (SELECT 1 FROM {$dbprefix}entity_relationships
							WHERE guid_one = $guid
								AND relationship = 'membership_request'
								AND guid_two = e.guid)
						";
				break;
		}

		$params = array(
			'filter' => $filter,
			'target' => $target,
			// BC
			'rel' => $filter,
			'page_owner' => $target,
		);

		$options = elgg_trigger_plugin_hook('rel_options', 'group', $params, $options); // BC hook
		$options = elgg_trigger_plugin_hook('filter_options', 'group', $params, $options);

		return $options;
	}

}
