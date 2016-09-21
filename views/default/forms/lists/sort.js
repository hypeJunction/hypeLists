define(function (require) {

	var elgg = require('elgg');
	var $ = require('jquery');
	var spinner = require('elgg/spinner');
	var timeout, xhr;

	$(document).on('submit', '.elgg-form-sortable-list', function (e) {
		var $form = $(this);
		var $container = $form.closest('.elgg-sortable-list');

		if (xhr && xhr.readystate !== 4) {
			xhr.abort();
		}

		xhr = elgg.get($form.attr('action'), {
			data: $form.serialize(),
			beforeSend: spinner.start,
			complete: spinner.stop,
			success: function (output) {
				var id = $container.attr('id');
				var $new;
				if ($(output).is('#' + id)) {
					$new = $(output);
				} else {
					$new = $(output).find('#' + id);
				}
				if ($new.length === 0) {
					elgg.register_error(elgg.echo('sort:search:empty'));
				} else {
					var $list = $new.find('.elgg-sortable-list-view');
					$container.find('.elgg-sortable-list-view').replaceWith($list);
				}
			}
		});

		return false;
	});

	$(document).on('keyup', '.elgg-sortable-list-query', function (e) {
		if ($(this).data('previousValue') === $(this).val()) {
			return;
		}
		window.clearTimeout(timeout);
		timeout = window.setTimeout(function (msg) {
			$(this).data('previousValue', $(this).val());
			$(this).closest('.elgg-form').trigger('submit');
		}.bind(this), 2000); // wait for user to press Enter first
	});

	$(document).on('change', '.elgg-sortable-list-select', function (e) {
		$(this).closest('form').trigger('submit');
	});

	$(document).on('click', '.elgg-sortable-list-form-toggle', function(e) {
		e.preventDefault();
		$(this).siblings('.elgg-sortable-list-fieldset').toggleClass('hidden');
		$(this).remove();
	});

});