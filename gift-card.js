$(document).ready(function(){
	recalculatePrice();
	$('#logoImage a').attr('href', 'http://www.thefoodproject.org');   
	$('#logoImage a').attr('target', '_blank');

	$('#dedication-check').change(function() {
		$('.dedication-fields').toggle(500);      
	});

	$('#dedication-message-check').change(function() {
		$('.dedication-message-fields').toggle(500);      
	});

	$("input[type='radio'][name='giftAmount']").change(function(){
		recalculatePrice();
	});

	$('.dedication-email-only').change(function() {
		$('.dedication-address-fields').toggle(500);      
	});
	$("#other-gift-amt").on('keyup', function() {
		$('input:radio[name=giftAmount]').filter('[value="other"]').attr('checked', true);
		recalculatePrice();
	});


	$(function(){
		jQuery('#areaCode').keyup(function(e){
			if($(this).val().length==$(this).attr('maxlength')){
				$('#firstNum').focus()
			}
		})
	});
	$(function(){
		jQuery('#firstNum').keyup(function(e){
			if($(this).val().length==$(this).attr('maxlength')){
				$('#secNum').focus()
			}
		})
	});

});

var client_token = '';

jQuery.ajax({
	type: "GET",
	dataType: 'jsonp',
	url: 'https://checkout-processor.herokuapp.com/client_token',
	success: function(response){
		client_token = response;
	},
	async:   false
});
$("#payment-form").validate({
	rules: {
		ccnumber: {
			required: true,
			creditcard: true
		}
	}
});
var BTResponseHandler = function(status, nonce) {
	var $form = $('#payment-form');
	
	if (nonce.error) {
				// Show the errors on the form
				$form.find('.payment-errors').text(nonce.error.message);
				$form.find('button').prop('disabled', false);
			} else {
				// token contains id, last4, and card type
				var token = nonce;
				// Insert the token into the form so it gets submitted to the server
				$form.append($('<input type="hidden" name="payment_method_nonce" />').val(token));
				source = getUrlParameter("src");
				if (source === undefined){
					source = getUrlParameter("source"); 
				}
				$form.append($('<input type="hidden" name="source" />').val(source));
				$form.append($('<input type="hidden" name="transaction_type" />').val('gift-card'));

				$form.append($('<input type="hidden" name="giftAmount" />').val(giftAmount));
				// and re-submit
				console.log($form.serialize());
				$.ajax({

					url: 'https://checkout-processor.herokuapp.com/process_checkout',
					type: "POST",
					data: $form.serialize(),
					crossDomain: true,
					dataType:"json",
					error: function(jqXHR, textStatus, errorThrown){
						$('#card-error').html("Uh oh! We encountered an error and it has been reported to us. Please refresh the page and try again. If the problem persists, please contact us at <a href='mailto:tech@thefoodproject.org'>tech@thefoodproject.org</a> and we'll be glad to sort it out!");
						reportError(jqXHR, errorThrown, textStatus);
					},
					success: function(data)
					{
						console.log(data);
						if (data.success == 'true'){
							$(location).attr('href',data.callback);
						} else if (data.success == 'false') {

							$('#card-error').text(data.message);
							$('#pmt-submit').attr("disabled", false);
							$('#pmt-submit').val("Retry Purchase");
							$('#pmt-submit').css('background-color', '#277000');
						} else if (data.success == 'verification_error'){
							message = "";
							if (data.message.length == 1){
								message += 'There was a problem with your card: ';
								message += data.message[0];
							}
							else 
							{
								message += "There were the problems with your card: ";
								message += data.message.toString();
							}
							$('#card-error').text(message);
							$('#pmt-submit').attr("disabled", false);
							$('#pmt-submit').val("Retry Purchase");
							$('#pmt-submit').css('background-color', '#277000'); 
						} else {
							$('#card-error').text('There was a problem with your card. Please check the card information, or use a different card.');
							$('#pmt-submit').attr("disabled", false);
							$('#pmt-submit').val("Retry Purchase");
							$('#pmt-submit').css('background-color', '#277000');
						}
					}
				});
}
};

jQuery(function($) {$('#payment-form').submit(function(e) {
	var $form = $(this);
				// Disable the submit button to prevent repeated clicks
				$('#pmt-submit').attr("disabled", true);
				$('#pmt-submit').css('background-color', 'gray');
				$('#pmt-submit').val("Processing...");
				var client = new braintree.api.Client({clientToken: client_token});
				client.tokenizeCard({
					number: $form.find('#ccnumber').val(), 
					expirationDate: $form.find('#exp-month').val() + "/" + $form.find('#exp-year').val(),
					cvv: $form.find('#cc-cvc').val()}, function (err, nonce) {
						BTResponseHandler(status, nonce);
					});
				// Prevent the form from submitting with the default action
				return false;
			});
});

function recalculatePrice(){
	var selectedGift = $("input[type='radio'][name='giftAmount']:checked");
	if (selectedGift.val() == 'other'){
		if ($('#other-gift-amt').val().replace(/[^0-9.]/g, "") === ""){
			giftAmount = 0;
		} else {
			giftAmount =  parseFloat($('#other-gift-amt').val().replace(/[^0-9.]/g, ""));
		}
	} else {
		giftAmount = parseFloat(selectedGift.val());
	}
	giftAmount = giftAmount.toFixed(2);
	jQuery('#totalPayment').text("$" + giftAmount);
	
}
function getUrlParameter(sParam)
{
	var sPageURL = window.location.search.substring(1);
	var sURLVariables = sPageURL.split('&');
	for (var i = 0; i < sURLVariables.length; i++) 
	{
		var sParameterName = sURLVariables[i].split('=');
		if (sParameterName[0] == sParam) 
		{
			return sParameterName[1];
		}
	}
};