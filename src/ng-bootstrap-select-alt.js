
(function() {
    'use strict';

    angular
    .module('bootstrapSelectAlt', ['ngSanitize'])
    .directive('bsSelect', ['$compile', function($compile) {
        var template = ' \
        <button type="button" \
            class="btn dropdown-toggle btn-default" \
            title="Mustard" \
            aria-expanded="false" \
            ng-click="toggleDropdown()"> \
            <span class="filter-option pull-left"> \
                {{ anySelected() ? config.selectedMessageFn(model) : config.emptyMessage }} \
            </span>&nbsp; \
            <span class="bs-caret"> \
                <span class="caret"></span> \
            </span> \
        </button> \
        <div class="dropdown-menu open" ng-transclude> \
        </div> \
        ';

        return {
            link: link,
            template: template,
            transclude: true,
            restrict: "E",
            scope: {
                'model':  '=?bsModel',
                'config': '=?bsConfig',
                'config.allowNoSelection': '=?bsAllowNoSelection',
                'config.multiple': '=?bsMultiple',
                'config.emptyMessage': '@?bsEmptyMessage',
                'config.selectedMessageFn': '=?bsSelectedMessageFn',
                'config.label': '@?bsLabelField',
                'config.labelFn': '=?bsLabelFn',
                'config.keyName': '@?keyName'
            },
            controller: ['$scope', BsSelectCtrl]
        }

        function link(scope, element, attrs, ctrl) {
            element.addClass('btn-group bootstrap-select show-tick');
            element.find('ul').addClass('dropdown-menu inner')
            scope.toggleDropdown = function() {
                element.toggleClass('open');
            }
            // scope.$watchCollection('options', function(newVal, oldVal) {
            //     ul.empty();
            //     scope.options.map(function(option) {
            //         ul.append($compile('<div>' + option.template + '<div>')(scope));
            //         return option;
            //     })
            // });
        }
        function BsSelectCtrl($scope) {
            var vm = this;
            defaultConfig();
            $scope.options = {};
            $scope.$watchCollection('options', function(newVal, oldVal) {
                vm.refresh();
            });
            if ($scope.config.multiple) {
                $scope.$watchCollection('model', function(newVal, oldVal) {
                    vm.refresh();
                });
            }
            else {
                $scope.$watch('model', function(newVal, oldVal) {
                    vm.refresh();
                })
            }
            vm.addOption = function(bsOption) {
                var key = vm.key(bsOption);
                $scope.options[key] = bsOption;
            }
            vm.removeOption = function(bsOption) {
                var key = vm.key(bsOption);
                delete $scope.options[key];
            }
            vm.key = function(bsOption) {
                return ($scope.config.keyName
                    ? bsOption.data()[$scope.config.keyName]
                    : bsOption.data())
            }
            vm.refresh = function() {
                if ($scope.config.multiple) {

                }
                else {
                    if ($scope.model !== undefined)
                        $scope.options
                }
                var length = $scope
            }
            vm.optionClick = function(bsOption) {
            }
            $scope.anySelected = function() {
                if ($scope.config.multiple) {
                    return $scope.model.length > 0
                }
                else {
                    return $scope.model !== undefined;
                }
            }
            function defaultConfig() {
                var config = $scope.config || {};

                config.allowNoSelection = config.allowNoSelection || 
                    $scope["config.allowNoSelection"];
                if (config.allowNoSelection == null)
                    config.allowNoSelection = true;

                config.multiple = config.multiple || 
                    $scope["config.multiple"] || false;

                if (config.multiple)
                    $scope.model = [];

                config.emptyMessage = config.emptyMessage ||
                    $scope["config.emptyMessage"] || '(Nothing selected)';

                config.selectedMessageFn = config.selectedMessageFn ||
                    $scope["config.selectedMessageFn"] || 
                    function() { return config.multiple ?
                        $scope.model.join(", ") : $scope.model };

                config.key = config.key ||
                    $scope["config.key"];

                config.compareFn = config.compareFn ||
                    $scope["config.compareFn"] ||
                    function(val, option) {
                        return val == option;
                    }

                config.closeOnSelect = !Boolean(config.multiple);

                $scope.config = config;
            }
        }
    }])
    .directive('bsOption', [function() {
        var template = ' \
            <a ng-click="click()"> \
                <span class="text" ng-transclude></span> \
                <span ng-if="selected" class="glyphicon glyphicon-ok check-mark"></span> \
            </a> \
        ';
        return {
            link: link,
            transclude: true,
            template: template,
            restrict: 'A',
            scope: {
                'data': '=bsOption',
                'selectable': '=?bsSelectable'
            },
            require: ['^^bsSelect', 'bsOption'],
            controller: ['$scope', BsOptionCtrl]
        }
        function link(scope, element, attrs, ctrls) {
            var bsSelect = ctrls[0];
            var bsOption = ctrls[1];
            if ($scope.data !== undefined) {
                bsSelect.addOption(bsOption);   
            }
            scope.bsSelect = bsSelect;
            scope.el = element;
        }
        function BsOptionCtrl($scope) {
            var vm = this;
            if ($scope.data !== undefined) {
                $scope.$on('$destroy', function() {
                    $scope.bsSelect.removeOption(vm);
                })   
            }
            if ($scope.selectable !== false) $scope.selectable = true;
            vm.mark = function(selected) {
                $scope.el.toggleClass('selected', selected);
            }
            vm.data = function() {
                return $scope.data;
            }
            vm.isSelected = function() {
                return Boolean($scope.selected);
            }
            vm.toggle = function(state) {
                if (state == null) state = !$scope.selected;
                $scope.selected = state;
                vm.mark(state);
            }
            vm.selectable = function() {
                return $scope.selectable;
            }
            $scope.click = function() {
                $scope.bsSelect.optionClick(vm);
            }
        }
    }])
})();

