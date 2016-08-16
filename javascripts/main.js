var $scope;
(function() {

	angular
	.module('ghPage', ['bootstrapSelectAlt'])
	.controller('ctrl', ['$scope', ctrl])

	function ctrl(scope) {
		$scope = scope;
	}

	angular
	.module('ghPage')
	.directive('myCode', ['$compile', function($compile) {

		var template = ' \
        <pre class="prettyprint" lang-html></pre> \
        <div></div> \
        ';

		return {
			link: link,
			transclude: true,
			template: template
		}

		function htmlUnescape(str){
		    return str
		        .replace(/&quot;/g, '"')
		        .replace(/&#39;/g, "'")
		        .replace(/&lt;/g, '<')
		        .replace(/&gt;/g, '>')
		        .replace(/&amp;/g, '&');
		}

		function link(scope, element, attrs, ctrl, $transclude) {
			var pre = element.find('pre');
			var div = element.find('div');
			$transclude(function(clone) {
				var html = clone.html();
				html = html.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
				pre.append(html);
				html = htmlUnescape(clone.html());
				var el = angular.element(html)
				$compile(el)(scope);
				div.append(el);

			})
		}
	}])
	.directive('script', function() {
    return {
      restrict: 'E',
      scope: false,
      link: function(scope, elem, attr) {
        if (attr.type === 'text/javascript-lazy') {
          var code = elem.text();
          var f = new Function(code);
          f();
        }
      }
    };
  });

})();