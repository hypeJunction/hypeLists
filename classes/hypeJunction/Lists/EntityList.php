<?php

namespace hypeJunction\Lists;

use ElggBatch;
use ElggEntity;
use stdClass;

abstract class EntityList {

	/**
	 * @var array
	 */
	protected $options = [];

	/**
	 * @var array
	 */
	protected $prepared_options = [];

	/**
	 * @var callable
	 */
	protected $getter;

	/**
	 * @var array
	 */
	protected $sorts = [];

	/**
	 * @var string
	 */
	protected $search_query = '';

	/**
	 * @var array
	 */
	protected $search_options = [];

	/**
	 * @var array
	 */
	protected $filters = [];

	/**
	 * Constructor
	 *
	 * @param array    $options An array of ege* options
	 */
	public function __construct(array $options = []) {
		$this->setOptions($options);
		$this->getter = 'elgg_get_entities_from_attributes';
	}

	/**
	 * Set ege* options
	 * 
	 * @param array $options Ege* options
	 * @return self
	 */
	public function setOptions(array $options = []) {
		$this->options = $options;
		unset($this->prepared_options);
		return $this;
	}

	/**
	 * Returns an array of ege* options with sorting and other queries
	 * @return array
	 */
	public function getOptions() {

		$options = $this->options;

		unset($options['type']);
		$options['types'] = [$this->getEntityType()];

		$filters = $this->filters;
		if (!empty($filters)) {
			foreach ($filters as $filter) {
				$name = $filter['filter'];
				$target = $filter['target'];
				$options = $this->addFilterQuery($options, $name, $target);
			}
		}

		$sorts = $this->sorts;
		if (empty($sorts)) {
			$sorts[] = [
				'field' => 'time_created',
				'direction' => 'DESC',
			];
		}

		foreach ($sorts as $sort) {
			$field = $sort['field'];
			$direction = $sort['direction'];
			$options = $this->addSortQuery($options, $field, $direction);
		}

		if ($this->search_query) {
			$options = $this->addSearchQuery($options, $this->search_query, $this->search_options);
		}

		if ($this->search_query || !empty($this->filters)) {
			if (!isset($options['no_results'])) {
				$options['no_results'] = elgg_echo('sort:search:empty');
			}
		}

		return $options;
	}

	/**
	 * Returns count of entities in a batch
	 * @return int
	 */
	public function getCount() {
		$options = $this->getOptions();
		$options['count'] = true;
		return (int) call_user_func($this->getter, $options);
	}

	/**
	 * Returns items of the list as an array or batch
	 *
	 * @param bool $batch Return ElggBatch
	 * @return mixed
	 */
	public function getItems($batch = false) {
		$entities = new ElggBatch($this->getter, $this->getOptions());
		if ($batch) {
			return $entities;
		}
		$items = [];
		foreach ($entities as $entity) {
			$items[] = $entity;
		}
		return $items;
	}

	/**
	 * Returns an array of GUIDs of items in the batch
	 * @return int[]
	 */
	public function getGUIDs() {
		$options = $this->getOptions();
		$options['callback'] = false;

		$rows = new ElggBatch($this->getter, $options);

		$guids = [];
		foreach ($rows as $row) {
			$guids[] = $row->guid;
		}
		return $guids;
	}

	/**
	 * Exports a list into a serializable object
	 * @return stdClass
	 */
	public function toObject() {

		$options = $this->getOptions();
		$result = (object) [
			'type' => 'list',
			'count' => $this->getCount(),
			'limit' => elgg_extract('limit', $options, elgg_get_config('default_limit')),
			'offset' => elgg_extract('offset', $options, 0),
			'sorts' => $this->sorts,
			'filters' => array_map(function($e) {
				return [
					'filter' => $e['filter'],
					'target' => $e['target'] ? $e['target']->guid : 0,
				];
			}, $this->fiilters),
			'items' => [],
		];

		$entities = new ElggBatch($this->getter, $options);
		foreach ($entities as $entity) {
			if (is_object($entity) && is_callable([$entity, 'toObject'])) {
				$result->items[] = $entity->toObject();
			} else {
				$result->items[] = $entity;
			}
		}

		return $result;
	}

	/**
	 * Set sort field and direction
	 * 
	 * @param string $field     Field name
	 * @param string $direction Sort direction
	 * @param int    $priority  Priority
	 * @return self
	 */
	public function addSort($field = 'time_created', $direction = 'DESC', $priority = 500) {

		if (!$field || !$direction) {
			return $this;
		}

		while (isset($this->sorts[$priority])) {
			$priority++;
		}

		$field = sanitize_string($field);
		$direction = strtoupper(sanitize_string($direction));

		if (!in_array($direction, array('ASC', 'DESC'))) {
			$direction = self::DEFAULT_SORT_DIRECTION;
		}

		$this->removeSort($field);

		$this->sorts[$priority] = [
			'field' => $field,
			'direction' => $direction,
		];

		ksort($this->sorts);

		return $this;
	}

	/**
	 * Remove sort field
	 *
	 * @param string $field Field name
	 * @return self
	 */
	public function removeSort($field) {
		foreach ($this->sorts as $key => $value) {
			if ($value['field'] == $field) {
				unset($this->sorts[$key]);
			}
		}

		return $this;
	}

	/**
	 * Returns a list of sort options
	 *
	 * @return array $params Params to pass to the hook
	 * @return array
	 */
	public function getSortOptions(array $params = []) {

		$options = $this->getOptions();

		$plugin = elgg_get_plugin_from_id('hypeLists');
		$settings = $plugin->getAllSettings();

		foreach ($settings as $k => $val) {
			if (!$val) {
				continue;
			}
			list(, $entity_type, $field, $direction) = explode('::', $k);
			if ($entity_type != $this->getEntityType()) {
				continue;
			}
			if ($field && in_array(strtolower($direction), array('asc', 'desc'))) {
				$sort_options[] = "$field::$direction";
			}
		}

		$params['list'] = $this;

		$sort_options = elgg_trigger_plugin_hook('sort_fields', $this->getEntityType(), $params, $sort_options);

		$subtypes = elgg_extract('subtype', $options);
		if (!$subtypes) {
			$subtypes = elgg_extract('subtypes', $options);
		}
		if (!empty($subtypes)) {
			$subtypes = (array) $subtypes;
			$subtype = array_shift($subtypes);
			$sort_options = elgg_trigger_plugin_hook('sort_fields', "object:$subtype", $params, $sort_options);
		}

		return $sort_options;
	}

	/**
	 * Returns a list of filter optioons
	 * @return array
	 */
	public function getFilterOptions() {
		return elgg_trigger_plugin_hook('sort_relationships', $this->getEntityType(), ['list' => $this], []);
	}

	/**
	 * Returns a list of subtype options
	 * @return array
	 */
	public function getSubtypeOptions() {
		$types = get_registered_entity_types();
		$types = elgg_trigger_plugin_hook('search_types', 'get_queries', [], $types);

		return elgg_extract($this->getEntityType(), $types);
	}

	/**
	 * Set a search query
	 *
	 * @param string $search_query   Search query
	 * @param array  $search_options Search options
	 *                                - 'fields' - optional array of attribute and metadata names to search in
	 *                                - 'advanced' - extend search to tags/profile fields
	 * @return self
	 */
	public function setQuery($search_query = '', array $search_options = []) {
		$this->search_query = sanitize_string(stripslashes($search_query));
		$this->search_options = $search_options;
		return $this;
	}

	/**
	 * Remove search query
	 * @return self
	 */
	public function unsetQuery() {
		$this->search_query = '';
		$this->search_options = [];
		return $this;
	}

	/**
	 * Add relationship filter
	 * 
	 * @param string     $filter   Filter name
	 * @param ElggEntity $target   Target entity
	 * @param int        $priority Priority
	 * @return self
	 */
	public function addFilter($filter, ElggEntity $target = null, $priority = 500) {
		if (!$filter) {
			return $this;
		}

		while (isset($this->filters[$priority])) {
			$priority++;
		}

		$this->removeFilter($filter);

		if (!isset($target)) {
			$target = elgg_get_logged_in_user_entity();
		}

		$this->filters[$priority] = [
			'filter' => $filter,
			'target' => $target,
		];

		ksort($this->filters);

		return $this;
	}

	/**
	 * Remove filter
	 *
	 * @param string $filter Filter name
	 * @return self
	 */
	public function removeFilter($filter) {
		foreach ($this->filters as $key => $value) {
			if ($value['filter'] == $filter) {
				unset($this->filters[$key]);
			}
		}

		return $this;
	}

	/**
	 * Returns a where clause for a search query.
	 *
	 * @see search_get_where_sql
	 * 
	 * @param str   $table        Prefix for table to search on
	 * @param array $fields       Fields to match against
	 * @param array $params       Original search params
	 * @param bool  $use_fulltext Use fulltext search
	 * @return str
	 */
	public static function getFieldSearchWhereClause($table, $fields, $params, $use_fulltext = TRUE) {
		if (is_callable('search_get_where_sql')) {
			return search_get_where_sql($table, $fields, $params, $use_fulltext);
		}

		$query = $params['query'];

		// add the table prefix to the fields
		foreach ($fields as $i => $field) {
			if ($table) {
				$fields[$i] = "$table.$field";
			}
		}

		$where = '';

		$search_info = elgg_get_config('search_info');

		// if query is shorter than the min for fts words
		// it's likely a single acronym or similar
		// switch to literal mode
		if (elgg_strlen($query) < $search_info['min_chars']) {
			$likes = array();
			$query = sanitise_string($query);
			foreach ($fields as $field) {
				$likes[] = "$field LIKE '%$query%'";
			}
			$likes_str = implode(' OR ', $likes);
			$where = "($likes_str)";
		} else {
			// if we're not using full text, rewrite the query for bool mode.
			// exploiting a feature(ish) of bool mode where +-word is the same as -word
			if (!$use_fulltext) {
				$query = '+' . str_replace(' ', ' +', $query);
			}

			// if using advanced, boolean operators, or paired "s, switch into boolean mode
			$booleans_used = preg_match("/([\-\+~])([\w]+)/i", $query);
			$advanced_search = (isset($params['advanced_search']) && $params['advanced_search']);
			$quotes_used = (elgg_substr_count($query, '"') >= 2);

			$options = '';
			if (!$use_fulltext || $booleans_used || $advanced_search || $quotes_used) {
				$options = 'IN BOOLEAN MODE';
			}

			$query = sanitise_string($query);

			$fields_str = implode(',', $fields);
			$where = "(MATCH ($fields_str) AGAINST ('$query' $options))";
		}

		return $where;
	}

	/**
	 * Returns base URL of the list
	 * @return string
	 */
	public function getBaseURL() {
		$options = $this->getOptions();
		$base_url = elgg_extract('base_url', $options);
		$offset_key = elgg_extract('offset_key', $options, 'offset');

		if (!$base_url) {
			$base_url = current_page_url();
		}

		$base_url = elgg_http_remove_url_query_element($base_url, 'query');
		$base_url = elgg_http_remove_url_query_element($base_url, 'sort');
		$base_url = elgg_http_remove_url_query_element($base_url, 'limit');
		$base_url = elgg_http_remove_url_query_element($base_url, $offset_key);

		return $base_url;
	}

	/**
	 * Returns list id
	 * @return string 
	 */
	public function getId() {
		$options = $this->getOptions();
		$id = elgg_extract('list_id', $options);
		if (!$id) {
			$id = md5($this->getBaseURL());
		}
		return $id;
	}

	/**
	 * Render a list of items
	 * @return string
	 */
	public function render() {

		$type = $this->getEntityType();
		$options = $this->getOptions();

		$options['base_url'] = $this->getBaseURL();
		$options['list_id'] = $this->getId();

		$list = elgg_list_entities($options, $this->getter);
		$list = elgg_format_element('div', [
			'class' => 'elgg-sortable-list-view',
		], $list);
		
		if (empty($this->search_query) && empty($this->filters) && !preg_match_all("/<ul.*>.*<\/ul>/s", $list)) {
			// List is empty
			return $list;
		}

		$sort_options = (array) elgg_extract('sort_options', $options, $this->getSortOptions());
		$filter_options = (array) elgg_extract('filter_options', $options, $this->getFilterOptions());
		$subtype_options = (array) elgg_extract('subtype_options', $options, $this->getSubtypeOptions());

		$show_subtype = elgg_extract('show_subtype', $options, false) && !empty($subtype_options);
		$show_sort = elgg_extract('show_sort', $options, false) && !empty($sort_options);
		$show_search = elgg_extract('show_search', $options, false);
		if (isset($options['show_rel'])) {
			// BC
			$show_filter = $options['show_rel'] && !empty($filter_options);
		} else {
			$show_filter = elgg_extract('show_filter', $options, false) && !empty($filter_options);
		}

		$form = '';
		if ($show_sort || $show_search || $show_filter || $show_subtype) {

			$form_vars = [
				'entity_type' => $this->getEntityType(),
				'show_sort' => $show_sort,
				'show_search' => $show_search,
				'show_filter' => $show_filter,
				'show_subtype' => $show_subtype,
				'filter' => array_map(function($e) {
					return $e['filter'];
				}, $this->filters),
				'query' => $this->search_query,
				'sort' => array_map(function($e) {
					return strtolower("{$e['field']}::{$e['direction']}");
				}, $this->sorts),
				'sort_options' => $sort_options,
				'filter_options' => $filter_options,
				'subtype_options' => $subtype_options,
				'expand_form' => elgg_extract('expand_form', $options),
			];

			$form = elgg_view_form('lists/sort', array(
				'action' => $this->getBaseURL(),
				'method' => 'GET',
				'disable_security' => true,
				'class' => 'elgg-form-sortable-list',
			), $form_vars);
		}

		echo elgg_format_element('div', [
			'id' => "$type-sort-{$this->getId()}",
			'class' => "elgg-sortable-list $type-sort-list",
		], $form . $list);
	}

	/**
	 * Returns entity type of list items
	 * @return string
	 */
	abstract public static function getEntityType();

	/**
	 * Add sort queries for a given field and direction
	 *
	 * @param array  $options   Ege* options
	 * @param string $field     Field name
	 * @param string $direction ASC|DESC
	 * @return array
	 */
	abstract public static function addSortQuery(array $options = [], $field = 'time_created', $direction = 'DESC');

	/**
	 * Add search queries
	 *
	 * @param array  $options        Ege* options
	 * @param string $query          Search query
	 * @param array  $search_options Extended search options
	 * @return array
	 */
	abstract public static function addSearchQuery(array $options = [], $query = '', array $search_options = []);

	/**
	 * Add search queries
	 *
	 * @param array      $options Ege* options
	 * @param string     $filter  Filter name
	 * @param ElggEntity $target  Target entity
	 * @return array
	 */
	abstract public static function addFilterQuery(array $options = [], $filter = '', ElggEntity $target = null);
}
