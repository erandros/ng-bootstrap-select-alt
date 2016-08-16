
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
                'output':  '=?bsSelect',
                'source': '=?bsSource',
                'config': '=?bsConfig',
                'config.allowNoSelection': '=?bsAllowNoSelection',
                'config.multiple': '=?bsMultiple',
                'config.emptyMessage': '@?bsEmptyMessage',
                'config.selectedMessageFn': '=?bsSelectedMessageFn',
                'config.label': '@?bsLabelField',
                'config.labelFn': '=?bsLabelFn',
                'config.keyName': '@?keyName',
            },
            controller: ['$scope', BsSelectCtrl]
        }

        function link(scope, element, attrs, ctrl) {
            element.addClass('btn-group bootstrap-select show-tick');
            element.find('ul').addClass('dropdown-menu inner')
            scope.toggleDropdown = function() {
                element.toggleClass('open');
            }
        }
        function BsSelectCtrl($scope) {
            var vm = this;
            defaultConfig();
            $scope.options = {};
            $scope.src = undefined;
            var srcWatch, optionClick, _addOption, _removeOption;
            if ($scope.config.multiple) {
                $scope.selectedOptions = {};
                var deselectAll = function() {
                    var opts = $scope.selectedOptions;
                    for (var opts in opts) {
                        if (opts.hasOwnProperty(opt)) {
                            opt.toggle(false);
                        }
                    }
                    $scope.selectedOptions = {};
                }
                function srcArrayToObject(array) {
                    var obj = {};
                    var length = array.length;
                    for (var i = 0; i < length; i++) {
                        var el = array[i];
                        var keyVal = vm.keyValue(el);
                        if (obj.hasOwnProperty(keyVal))
                            throw new Error('Found duplicate key in bsSrc: ' + keyVal);
                        obj[keyVal] = el;
                    }
                    $scope.srcObject = obj;
                }
                var checkOptionsFromSrc = function() {
                    $scope.src.forEach(function(obj) {
                        var keyValue = vm.keyValue(obj);
                        var option = $scope.options[keyValue];
                        if (option) {
                            $scope.selectedOptions[keyValue] = option;
                            option.toggle(true);
                        }
                    })
                }
                srcWatch = function(newVal, oldVal) {
                    if (!(newVal instanceof Array)) {
                        throw new Error(
                            'In multiple mode, bsSource should be an array, but it is: ' + newVal);
                    }
                    deselectAll();
                    srcArrayToObject();
                    checkOptions();
                }
                function isOptionSelected(bsOption) {
                    return $scope.selectedOptions[bsOption.keyValue()] !== undefined;
                }
                function select(bsOption) {
                    bsOption.toggle(true);
                    $scope.selectedOptions[bsOption.keyValue()] = bsOption;
                }
                function deselect(bsOption) {
                    bsOption.toggle(false);
                    delete $scope.selectedOptions[bsOption.keyValue()];
                }
                optionClick = function(bsOption) {
                    if (isOptionSelected(bsOption)) {
                        if ($scope.config.allowNoSelection) {
                            deselect(bsOption);
                        }
                    }
                    else select(bsOption);
                }
                _addOption = function(bsOption) {
                    var key = bsOption.keyValue();
                    if ($scope.srcObject.hasOwnProperty(key)) {
                        $scope.selectedOptions[key] = bsOption;
                    }
                }
                _removeOption = function(bsOption) {
                    var key = bsOption.keyValue()
                    if ($scope.selectedOptions.hasOwnProperty(key)) {
                        delete $scope.selectedOptions[key];
                    }
                }
            }
            else {
                $scope.selectedOption;
                function select(bsOption) {
                    bsOption.toggle(true);
                    $scope.selectedOption = bsOption;
                }
                function delect() {
                    $scope.selectedOption.toggle(false);
                    $scope.selectedOption = undefined;
                }
                function anySelected() {
                    return $scope.selectedOption !== undefined;
                }
                srcWatch = function(newVal, oldVal) {
                    if ($scope.selectedOption !== undefined) {
                        deselect($scope.selectedOption);
                    }
                    if (newVal !== undefined) {
                        var key = vm.keyValue(newVal);
                        var option = $scope.options[key];
                        if (option !== undefined)
                            select(option);
                    }
                }
                optionClick = function(bsOption) {
                    if (bsOption.keyValue())
                }
                _addOption = function(bsOption) {
                    if (anySelected()) return;
                    var key = bsOption.keyValue();
                    if (vm.keyValue($scope.src) == bsOption.keyValue()) {
                        $scope.selectedOption = bsOption;
                    }
                }
                _removeOption = function(bsOption) {
                    if (anySelected() && $scope.selectedOption == bsOption) {
                        deselect();
                    }
                }
            }
            $scope.$watch('src', sourceWatch);
            vm.optionClick = optionClick;
            vm.addOption = function(bsOption) {
                var key = bsOption.keyValue();
                if ($scope.options.hasOwnProperty(key))
                    throw new Error('Tried to add option with duplicate key: ' + key);
                $scope.options[key] = bsOption;
                _addOption(bsOption)
            }
            vm.removeOption = function(bsOption) {
                var key = bsOption.keyValue();
                    if (!$scope.options.hasOwnProperty(key))
                        throw new Error('Tried to remove non existing option of key: ' + key);
                delete $scope.options[key];
                _removeOption(bsOption);
            }
            vm.keyValue = function(obj) {
                return ($scope.config.keyName
                    ? obj[$scope.config.keyName]
                    : obj)
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
    }]
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
            if ($scope.data !== undefined && $scope.selectable !== false) {
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
            vm.keyValue = function() {
                return scope.bsSelect.keyValue(vm.data());
            }
            $scope.click = function() {
                $scope.bsSelect.optionClick(vm);
            }
        }
    }])
})();

