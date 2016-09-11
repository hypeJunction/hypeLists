<?php

namespace hypeJunction\Lists;

use ElggEntity;

class ObjectList extends EntityList {

	const ENTITY_TYPE = 'object';

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
			$filter_options[] = 'mine';
			$filter_options[] = 'friends';
		}

		$params = [
			'list' => $this,
		];

		$filter_options = elgg_trigger_plugin_hook('sort_relationships', 'object', $params, $filter_options);

		$subtypes = elgg_extract('subtype', $options);
		if (!$subtypes) {
			$subtypes = elgg_extract('subtypes', $options);
		}
		
		if (!empty($subtypes)) {
			$subtypes = (array) $subtypes;
			$subtype = $subtypes[0];
			$filter_options = elgg_trigger_plugin_hook('sort_relationships', "object:$subtype", $params, $filter_options);
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

		$options['joins']['objects_entity'] = "
			JOIN {$dbprefix}objects_entity AS objects_entity
				ON objects_entity.guid = e.guid
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

			case 'title' :
			case 'description' :
				array_unshift($order_by, "objects_entity.{$field} {$direction}");
				break;

			case 'last_action' :
				$options['selects']['last_action'] = "
					GREATEST (e.time_created, e.last_action, e.time_updated) AS last_action
					";
				array_unshift($order_by, "last_action {$direction}");
				break;

			case 'likes_count' :
				$name_id = elgg_get_metastring_id('likes');
				$options['joins']['likes_count'] = "
					LEFT JOIN {$dbprefix}annotations AS likes
						ON likes.entity_guid = e.guid AND likes.name_id = $name_id
					";
				$options['selects']['likes_count'] = "COUNT(likes.id) as likes_count";
				$options['group_by'] = 'e.guid';

				array_unshift($order_by, "likes_count {$direction}");
				$order_by[] = 'e.time_created DESC'; // show newest first if count is the same
				break;

			case 'responses_count' :
				$ids = array();
				$ids[] = (int) get_subtype_id('object', 'comment');
				$ids[] = (int) get_subtype_id('object', 'discussion_reply');
				$ids_in = implode(',', $ids);

				$options['joins']['responses_count'] = "
					LEFT JOIN {$dbprefix}entities AS responses
						ON responses.container_guid = e.guid
						AND responses.type = 'object'
						AND responses.subtype IN ($ids_in)
					";
				$options['selects']['responses_count'] = "COUNT(responses.guid) as responses_count";
				$options['group_by'] = 'e.guid';

				array_unshift($order_by, "responses_count {$direction}");
				$order_by[] = 'e.time_created DESC'; // show newest first if count is the same
				break;
		}

		if ($field == 'alpha') {
			array_unshift($order_by, "objects_entity.title {$direction}");
		}

		$options['order_by'] = implode(', ', array_unique(array_filter($order_by)));

		$params = array(
			'field' => $field,
			'direction' => $direction,
		);

		return elgg_trigger_plugin_hook('sort_options', 'object', $params, $options);
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

		$options['joins']['objects_entity'] = "
			JOIN {$dbprefix}objects_entity objects_entity
				ON objects_entity.guid = e.guid
			";

		$advanced = elgg_extract('search_tags', $search_options, false);
		$attribute_names = ['title', 'description'];

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
			$metadata_fields = array_keys((array) elgg_get_registered_tag_metadata_names());
			$metadata_fields = array_diff($metadata_fields, $attribute_fields);
			$advanced = elgg_extract('advanced', $search_options, $advanced);
		}

		if (empty($attribute_fields)) {
			$attribute_fields = ['name'];
		}

		$where = self::getFieldSearchWhereClause('objects_entity', $attribute_fields, ['query' => $query], false);

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
			$metadata_fields_md_where = "(({$clauses['wheres'][0]}) AND metadata_fields_msv.string='$query')";

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

			case 'mine' :
			case 'owner' :
				$options['wheres']['filter_owner'] = "e.owner_guid = $guid";
				break;

			case 'container' :
			case 'group' :
				$options['wheres']['filter_container'] = "e.container_guid = $guid";
				break;

			case 'friends' :
				$options['wheres']['filter_friends'] = "
					EXISTS (SELECT 1 FROM {$dbprefix}entity_relationships
						WHERE guid_one = $guid
							AND relationship = 'friend'
							AND guid_two = e.owner_guid)
					";
				break;

			case 'user_groups' :
				$options['wheres']['filter_user_groups'] = "
					EXISTS (SELECT 1 FROM {$dbprefix}entity_relationships
						WHERE guid_one = e.container_guid
							AND relationship = 'member'
							AND guid_two = $guid)
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

		$options = elgg_trigger_plugin_hook('rel_options', 'object', $params, $options); // BC hook
		$options = elgg_trigger_plugin_hook('filter_options', 'object', $params, $options);

		return $options;
	}

}
