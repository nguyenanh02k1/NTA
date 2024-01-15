if ($(document).height() > $(window).height()) {
    var scrollTop = ($('html').scrollTop()) ? $('html').scrollTop() : $('body').scrollTop(); // Works for Chrome, Firefox, IE...
    $('html').addClass('noscroll').css('top',-scrollTop);         
}