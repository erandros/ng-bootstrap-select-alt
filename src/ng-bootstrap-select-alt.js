(function() {
    'use strict';

    angular
    .module('bootstrapSelectAlt', ['ngSanitize'])
    .directive('bsSelect', ['$compile', '$document', function($compile, $document) {
        var template = ' \
        <button type="button" \
            class="btn dropdown-toggle btn-default" \
            title="Mustard" \
            aria-expanded="false" \
            ng-click="toggleDropdown()"> \
            <span class="filter-option pull-left" ng-transclude="label"> \
                {{ anySelected() ? selectedMessage() : config.emptyMessage }} \
            </span>&nbsp; \
            <span class="bs-caret"> \
                <span class="caret"></span> \
            </span> \
        </button> \
        <div class="dropdown-menu open" ng-transclude="ul"> \
        </div> \
        ';

        return {
            link: link,
            template: template,
            transclude: {
                'ul': '?ul',
                'label': '?bsLabel'
            },
            restrict: "E",
            scope: {
                'selectedOutput':  '=?bsOutput',
                'src': '=?bsSrc',
                'key': '@?bsKey',
                'label': '@?bsLabel',
                'config': '=?bsConfig',
                'config.allowNoSelection': '=?bsAllowNoSelection',
                'config.selectFirstOption': '=?bsSelectFirstOption',
                'config.disableCheckmark': '=?bsDisableCheckmark',
                'config.multiple': '=?bsMultiple',
                'config.emptyMessage': '@?bsEmptyMessage',
                'config.selectedMessageFn': '=?bsSelectedMessageFn'
            },
            controller: ['$scope', BsSelectCtrl]
        }

        function link(scope, element, attrs, ctrl) {
            element.addClass('btn-group bootstrap-select show-tick');
            element.find('ul').addClass('dropdown-menu inner')
            scope.toggleDropdown = function() {
                element.toggleClass('open');
            }            
            var onClick = function(event) {
                var isChild = element[0].contains(event.target);
                var isSelf = element[0] == event.target;
                var isInside = isChild || isSelf;
                if (!isInside) {
                    element.toggleClass('open', false);
                }
            }
            $document.bind('click', onClick);
            scope.$on('$destroy', function() {
                $document.unbind('click', onClick);
            })
        }
        function BsSelectCtrl($scope) {
            var vm = this;
            defaultConfig();
            $scope.options = {};
            if ($scope.config.multiple) {
                $scope.selected = {};
            }
            else {
                $scope.selected = undefined;
            }
            var deselectAll = function() {
                var opts = $scope.selected;
                for (var opts in opts) {
                    if (opts.hasOwnProperty(opt)) {
                        opt.mark(false);
                    }
                }
                $scope.selected = {};
            }
            function srcArrayToObject(array) {
                var obj = {};
                var length = $scope.src.length;
                for (var i = 0; i < length; i++) {
                    var el = $scope.src[i];
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
                        $scope.selected[keyValue] = option;
                        option.mark(true);
                    }
                })
            }
            if ($scope.config.multiple) {
                $scope.$watchCollection('selected', function(newVal, oldVal) {
                    if (newVal === undefined && oldVal === undefined) return;
                    $scope.selectedOutput = Object.keys($scope.selected).map(function(key) {
                        return $scope.selected[key].data();
                    })
                });
            }
            else {
                $scope.$watch('selected', function(newVal, oldVal) {
                    if (newVal === undefined && oldVal === undefined) return;
                    if ($scope.selected === undefined)
                        $scope.selectedOutput = undefined;
                    else $scope.selectedOutput = $scope.selected.data();
                })
            }
            
            $scope.$watch('src', function(newVal, oldVal) {
                if (newVal === undefined && oldVal === undefined) return;
                if ($scope.config.multiple) {
                    if (!(newVal instanceof Array)) {
                        throw new Error(
                            'In multiple mode, bsSrc should be an array, but it is: ' + newVal);
                    }
                    deselectAll();
                    srcArrayToObject();
                    checkOptionsFromSrc();
                }
                else {
                    if ($scope.selected !== undefined) {
                        vm.deselect($scope.selected);
                    }
                    if (newVal !== undefined) {
                        var key = vm.keyValue(newVal);
                        var option = $scope.options[key];
                        if (option !== undefined)
                            vm.select(option);
                    }
                }
            });
            $scope.selectedMessage = function() {
                if ($scope.config.multiple) {
                    var arr = Object.keys($scope.selected).map(function(key) {
                        return $scope.selected[key].data();
                    })
                    return $scope.config.selectedMessageFn(arr);
                }
                else {
                    return $scope.config.selectedMessageFn($scope.selected.data());
                }
            }
            vm.optionClick = function(bsOption) {
                if ($scope.config.multiple) {
                    if (vm.isOptionSelected(bsOption)) {
                        if ($scope.selected.length == 1 &&
                            !$scope.config.allowNoSelection) {}
                        else vm.deselect(bsOption);
                    }
                    else vm.select(bsOption);
                }
                else {
                    if (vm.isOptionSelected(bsOption)) {
                        if ($scope.config.allowNoSelection) {
                            $scope.selected.mark(false);
                            $scope.selected = undefined;
                        }
                    }
                    else {
                        if ($scope.selected)
                            $scope.selected.mark(false);
                        $scope.selected = bsOption;
                        bsOption.mark(true);
                    }
                }
            }
            $scope.anySelected = function() {
                if ($scope.config.multiple) {
                    return Object.keys($scope.selected).length > 0;
                }
                else {
                    return $scope.selected !== undefined;
                }
            }
            vm.isOptionSelected = function(bsOption) {
                if ($scope.config.multiple) {
                    return $scope.selected[bsOption.keyValue()] !== undefined;
                }
                else {
                    return ($scope.selected != null &&
                        $scope.selected.keyValue() === bsOption.keyValue());
                }
            }
            vm.addOption = function(bsOption) {
                var key = bsOption.keyValue();
                if ($scope.options.hasOwnProperty(key))
                    throw new Error('Tried to add option with duplicate key: ' + key);
                $scope.options[key] = bsOption;
                if ($scope.config.multiple) {
                    if ($scope.srcObject == null) return;
                    if (Object.keys($scope.selected).length == 0 && $scope.config.selectFirstOption) {
                        vm.select(bsOption);
                    }
                    var key = bsOption.keyValue();
                    if ($scope.srcObject.hasOwnProperty(key)) {
                        vm.select(bsOption);
                    }
                }
                else {
                    if ($scope.anySelected()) return;
                    if ($scope.selected == null && $scope.config.selectFirstOption) {
                        vm.select(bsOption);
                    }
                    else if (vm.keyValue($scope.src) == bsOption.keyValue()) {
                        vm.select(bsOption);
                    }
                }
            }
            vm.select = function(bsOption) {
                if ($scope.config.multiple) {
                    bsOption.mark(true);
                    $scope.selected[bsOption.keyValue()] = bsOption;
                }
                else {
                    bsOption.mark(true);
                    $scope.selected = bsOption;
                }
            }
            vm.deselect = function(bsOption) {
                if ($scope.config.multiple) {
                    bsOption.mark(false);
                    delete $scope.selected[bsOption.keyValue()];
                }
                else {
                    $scope.selected.mark(false);
                    $scope.selected = undefined;
                }
            }
            vm.removeOption = function(bsOption) {
                var key = bsOption.keyValue();
                    if (!$scope.options.hasOwnProperty(key))
                        throw new Error('Tried to remove non existing option of key: ' + key);
                delete $scope.options[key];
                if ($scope.config.multiple) {
                    var key = bsOption.keyValue()
                    if ($scope.selected.hasOwnProperty(key)) {
                        delete $scope.selected[key];
                    }
                }
                else {
                    if (anySelected() && $scope.selected == bsOption) {
                        vm.deselect();
                    }
                }
            }
            vm.keyValue = function(obj) {
                return ($scope.key
                    ? obj[$scope.key]
                    : obj)
            }
            vm.config = function() {
                return $scope.config;
            }

            function defaultConfig() {
                var config = $scope.config || {};

                config.multiple = config.multiple || 
                    $scope["config.multiple"] || false;

                config.allowNoSelection = config.allowNoSelection || 
                    $scope["config.allowNoSelection"];
                if (config.allowNoSelection == null) {
                    config.allowNoSelection = config.multiple;
                }

                config.disableCheckmark = config.disableCheckmark || 
                    $scope["config.disableCheckmark"] || false;

                config.selectFirstOption = config.selectFirstOption ||
                    $scope["config.selectFirstOption"] || false;

                if (config.multiple)
                    $scope.model = [];

                config.emptyMessage = config.emptyMessage ||
                    $scope["config.emptyMessage"] || '(Nothing selected)';

                config.selectedMessageFn = config.selectedMessageFn ||
                    $scope["config.selectedMessageFn"] || 
                    function(data) { 
                        if ($scope.config.multiple) {
                            if ($scope.label) data = data.map(function(d) { return d[$scope.label]; })
                            return data.join(', ');
                        }
                        else {
                            if ($scope.label) data = data[$scope.label];
                            return data;
                        }
                    };

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
                <div class="text" ng-transclude></div> \
                <span class="glyphicon glyphicon-ok check-mark" ng-if="!disableCheckmark"></span> \
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
            scope.bsSelect = bsSelect;
            scope.disableCheckmark = bsSelect.config().disableCheckmark;
            scope.el = element;
            if (scope.data !== undefined && scope.selectable !== false) {
                bsSelect.addOption(bsOption);
            }
        }
        function BsOptionCtrl($scope) {
            var vm = this;
            if ($scope.data !== undefined) {
                $scope.$on('$destroy', function() {
                    $scope.bsSelect.removeOption(vm);
                });
            }
            if ($scope.selectable !== false) $scope.selectable = true;
            vm.mark = function(selected) {
                $scope.el.toggleClass('selected', selected);
            }
            vm.data = function() {
                return $scope.data;
            }
            vm.keyValue = function() {
                return $scope.bsSelect.keyValue(vm.data());
            }
            $scope.click = function() {
                if (!$scope.selectable) return;
                $scope.bsSelect.optionClick(vm);
            }
        }
    }])
    .directive('bsDropdown', ['$compile', '$document', function($compile, $document) {
        var template = ' \
        <div class="bs-dropdown btn dropdown-toggle btn-default" ng-click="toggleDropdown()"> \
            <span ng-transclude="label"> \
                <span ng-repeat="option in selected track by option.data()" bs-bullet="option"> \
                    {{ option.data() }} \
                </span> \
            </span> \
            <input onkeypress="this.style.width = ((this.value.length + 1) * 8) + \"px\";"> \
            </input> \
            <span class="bs-caret"> \
                <span class="caret"></span> \
            </span> \
        </div> \
        <div class="dropdown-menu open" ng-transclude="ul"> \
        </div> \
        ';

        return {
            link: link,
            template: template,
            transclude: {
                'ul': '?ul',
                'label': '?bsLabel'
            },
            restrict: "A",
            scope: {
                'selectedOutput':  '=?bsOutput',
                'src': '=?bsSrc',
                'key': '@?bsKey',
                'label': '@?bsLabel',
                'config': '=?bsConfig',
                'config.allowNoSelection': '=?bsAllowNoSelection',
                'config.selectFirstOption': '=?bsSelectFirstOption',
                'config.disableCheckmark': '=?bsDisableCheckmark',
                'config.multiple': '=?bsMultiple',
                'config.emptyMessage': '@?bsEmptyMessage',
                'config.selectedMessageFn': '=?bsSelectedMessageFn'
            },
            controller: ['$scope', BsSelectCtrl]
        }

        function link(scope, element, attrs, ctrl) {
            element.addClass('btn-group bootstrap-select show-tick');
            element.find('ul').addClass('dropdown-menu inner')
            scope.toggleDropdown = function() {
                element.addClass('open');
            }            
            var onClick = function(event) {
                var isChild = element[0].contains(event.target);
                var isSelf = element[0] == event.target;
                var isInside = isChild || isSelf;
                if (!isInside) {
                    element.toggleClass('open', false);
                }
            }
            $document.bind('click', onClick);
            scope.$on('$destroy', function() {
                $document.unbind('click', onClick);
            })
        }
        function BsSelectCtrl($scope) {
            var vm = this;
            $scope.selected = [];
            vm.optionClick = function(bsOption) {
                if (!bsOption.isSelected()) {
                    bsOption.mark(true);
                    $scope.selected.push(bsOption);
                }
            }
            vm.deselectOption = function(bsOption) {
                bsOption.mark(false);
                var i = $scope.selected.indexOf(bsOption);
                if (i == -1) throw new Error('Option not found');
                $scope.selected.splice(i, 1);
            }
            // defaultConfig();
            // $scope.options = {};
            // if ($scope.config.multiple) {
            //     $scope.selected = {};
            // }
            // else {
            //     $scope.selected = undefined;
            // }
            // var deselectAll = function() {
            //     var opts = $scope.selected;
            //     for (var opts in opts) {
            //         if (opts.hasOwnProperty(opt)) {
            //             opt.mark(false);
            //         }
            //     }
            //     $scope.selected = {};
            // }
            // function srcArrayToObject(array) {
            //     var obj = {};
            //     var length = $scope.src.length;
            //     for (var i = 0; i < length; i++) {
            //         var el = $scope.src[i];
            //         var keyVal = vm.keyValue(el);
            //         if (obj.hasOwnProperty(keyVal))
            //             throw new Error('Found duplicate key in bsSrc: ' + keyVal);
            //         obj[keyVal] = el;
            //     }
            //     $scope.srcObject = obj;
            // }
            // var checkOptionsFromSrc = function() {
            //     $scope.src.forEach(function(obj) {
            //         var keyValue = vm.keyValue(obj);
            //         var option = $scope.options[keyValue];
            //         if (option) {
            //             $scope.selected[keyValue] = option;
            //             option.mark(true);
            //         }
            //     })
            // }
            // if ($scope.config.multiple) {
            //     $scope.$watchCollection('selected', function(newVal, oldVal) {
            //         if (newVal === undefined && oldVal === undefined) return;
            //         $scope.selectedOutput = Object.keys($scope.selected).map(function(key) {
            //             return $scope.selected[key].data();
            //         })
            //     });
            // }
            // else {
            //     $scope.$watch('selected', function(newVal, oldVal) {
            //         if (newVal === undefined && oldVal === undefined) return;
            //         if ($scope.selected === undefined)
            //             $scope.selectedOutput = undefined;
            //         else $scope.selectedOutput = $scope.selected.data();
            //     })
            // }
            
            // $scope.$watch('src', function(newVal, oldVal) {
            //     if (newVal === undefined && oldVal === undefined) return;
            //     if ($scope.config.multiple) {
            //         if (!(newVal instanceof Array)) {
            //             throw new Error(
            //                 'In multiple mode, bsSrc should be an array, but it is: ' + newVal);
            //         }
            //         deselectAll();
            //         srcArrayToObject();
            //         checkOptionsFromSrc();
            //     }
            //     else {
            //         if ($scope.selected !== undefined) {
            //             vm.deselect($scope.selected);
            //         }
            //         if (newVal !== undefined) {
            //             var key = vm.keyValue(newVal);
            //             var option = $scope.options[key];
            //             if (option !== undefined)
            //                 vm.select(option);
            //         }
            //     }
            // });
            // $scope.selectedMessage = function() {
            //     if ($scope.config.multiple) {
            //         var arr = Object.keys($scope.selected).map(function(key) {
            //             return $scope.selected[key].data();
            //         })
            //         return $scope.config.selectedMessageFn(arr);
            //     }
            //     else {
            //         return $scope.config.selectedMessageFn($scope.selected.data());
            //     }
            // }
            // vm.optionClick = function(bsOption) {
            //     if ($scope.config.multiple) {
            //         if (vm.isOptionSelected(bsOption)) {
            //             if ($scope.selected.length == 1 &&
            //                 !$scope.config.allowNoSelection) {}
            //             else vm.deselect(bsOption);
            //         }
            //         else vm.select(bsOption);
            //     }
            //     else {
            //         if (vm.isOptionSelected(bsOption)) {
            //             if ($scope.config.allowNoSelection) {
            //                 $scope.selected.mark(false);
            //                 $scope.selected = undefined;
            //             }
            //         }
            //         else {
            //             if ($scope.selected)
            //                 $scope.selected.mark(false);
            //             $scope.selected = bsOption;
            //             bsOption.mark(true);
            //         }
            //     }
            // }
            // $scope.anySelected = function() {
            //     if ($scope.config.multiple) {
            //         return Object.keys($scope.selected).length > 0;
            //     }
            //     else {
            //         return $scope.selected !== undefined;
            //     }
            // }
            // vm.isOptionSelected = function(bsOption) {
            //     if ($scope.config.multiple) {
            //         return $scope.selected[bsOption.keyValue()] !== undefined;
            //     }
            //     else {
            //         return ($scope.selected != null &&
            //             $scope.selected.keyValue() === bsOption.keyValue());
            //     }
            // }
            // vm.addOption = function(bsOption) {
            //     var key = bsOption.keyValue();
            //     if ($scope.options.hasOwnProperty(key))
            //         throw new Error('Tried to add option with duplicate key: ' + key);
            //     $scope.options[key] = bsOption;
            //     if ($scope.config.multiple) {
            //         if ($scope.srcObject == null) return;
            //         if (Object.keys($scope.selected).length == 0 && $scope.config.selectFirstOption) {
            //             vm.select(bsOption);
            //         }
            //         var key = bsOption.keyValue();
            //         if ($scope.srcObject.hasOwnProperty(key)) {
            //             vm.select(bsOption);
            //         }
            //     }
            //     else {
            //         if ($scope.anySelected()) return;
            //         if ($scope.selected == null && $scope.config.selectFirstOption) {
            //             vm.select(bsOption);
            //         }
            //         else if (vm.keyValue($scope.src) == bsOption.keyValue()) {
            //             vm.select(bsOption);
            //         }
            //     }
            // }
            // vm.select = function(bsOption) {
            //     if ($scope.config.multiple) {
            //         bsOption.mark(true);
            //         $scope.selected[bsOption.keyValue()] = bsOption;
            //     }
            //     else {
            //         bsOption.mark(true);
            //         $scope.selected = bsOption;
            //     }
            // }
            // vm.deselect = function(bsOption) {
            //     if ($scope.config.multiple) {
            //         bsOption.mark(false);
            //         delete $scope.selected[bsOption.keyValue()];
            //     }
            //     else {
            //         $scope.selected.mark(false);
            //         $scope.selected = undefined;
            //     }
            // }
            // vm.removeOption = function(bsOption) {
            //     var key = bsOption.keyValue();
            //         if (!$scope.options.hasOwnProperty(key))
            //             throw new Error('Tried to remove non existing option of key: ' + key);
            //     delete $scope.options[key];
            //     if ($scope.config.multiple) {
            //         var key = bsOption.keyValue()
            //         if ($scope.selected.hasOwnProperty(key)) {
            //             delete $scope.selected[key];
            //         }
            //     }
            //     else {
            //         if (anySelected() && $scope.selected == bsOption) {
            //             vm.deselect();
            //         }
            //     }
            // }
            // vm.keyValue = function(obj) {
            //     return ($scope.key
            //         ? obj[$scope.key]
            //         : obj)
            // }
            // vm.config = function() {
            //     return $scope.config;
            // }

            function defaultConfig() {
                // var config = $scope.config || {};

                // config.multiple = config.multiple || 
                //     $scope["config.multiple"] || false;

                // config.allowNoSelection = config.allowNoSelection || 
                //     $scope["config.allowNoSelection"];
                // if (config.allowNoSelection == null) {
                //     config.allowNoSelection = config.multiple;
                // }

                // config.disableCheckmark = config.disableCheckmark || 
                //     $scope["config.disableCheckmark"] || false;

                // config.selectFirstOption = config.selectFirstOption ||
                //     $scope["config.selectFirstOption"] || false;

                // if (config.multiple)
                //     $scope.model = [];

                // config.emptyMessage = config.emptyMessage ||
                //     $scope["config.emptyMessage"] || '(Nothing selected)';

                // config.selectedMessageFn = config.selectedMessageFn ||
                //     $scope["config.selectedMessageFn"] || 
                //     function(data) { 
                //         if ($scope.config.multiple) {
                //             if ($scope.label) data = data.map(function(d) { return d[$scope.label]; })
                //             return data.join(', ');
                //         }
                //         else {
                //             if ($scope.label) data = data[$scope.label];
                //             return data;
                //         }
                //     };

                // config.key = config.key ||
                //     $scope["config.key"];

                // config.compareFn = config.compareFn ||
                //     $scope["config.compareFn"] ||
                //     function(val, option) {
                //         return val == option;
                //     }

                // config.closeOnSelect = !Boolean(config.multiple);

                // $scope.config = config;
            }
        }
    }])
    .directive('bsOption2', [function() {
        var template = ' \
            <a ng-click="click()"> \
                <div class="text" ng-transclude></div> \
                <span class="glyphicon glyphicon-ok check-mark" ng-if="!disableCheckmark"></span> \
            </a> \
        ';
        return {
            link: link,
            transclude: true,
            template: template,
            restrict: 'A',
            scope: {
                'data': '=bsOption2',
                'selectable': '=?bsSelectable'
            },
            require: ['^^bsDropdown', 'bsOption2'],
            controller: ['$scope', BsOptionCtrl]
        }
        function link(scope, element, attrs, ctrls) {
            var bsDropdown = ctrls[0];
            var bsOption = ctrls[1];
            scope.bsDropdown = bsDropdown;
            scope.el = element;
        }
        function BsOptionCtrl($scope) {
            var vm = this;
            $scope.click = function() {
                if (!$scope.selectable) return;
                $scope.bsSelect.optionClick(vm);
            }
            if ($scope.data !== undefined) {
                $scope.$on('$destroy', function() {
                    $scope.bsSelect.removeOption(vm);
                });
            }
            if ($scope.selectable !== false) $scope.selectable = true;
            vm.mark = function(selected) {
                $scope.el.toggleClass('selected', selected);
                $scope.isSelected = selected;
            }
            vm.data = function() {
                return $scope.data;
            }
            vm.isSelected = function() {
                return $scope.isSelected;
            }
            $scope.click = function() {
                if (!$scope.selectable) return;
                if ($scope.data === undefined) return;
                $scope.bsDropdown.optionClick(vm);
            }
        }
    }])
    .directive('bsBullet', ['$document', function($document) { 
        var template = ' \
            <div class="btn btn-primary btn-xs" ng-click="select()"> \
                <span ng-transclude></span> \
                <span class="glyphicon glyphicon-remove" ng-click="deselect()" aria-hidden="true"></span> \
            </div> \
        ';
        return {
            link: link,
            transclude: true,
            template: template,
            restrict: 'A',
            scope: {
                'bsOption': '=bsBullet'
            },
            require: ['^^bsDropdown', 'bsBullet'],
            controller: ['$scope', BsBulletCtrl]
        }
        function link(scope, element, attrs, ctrls) {
            scope.bsDropdown = ctrls[0];
            var bsBullet = ctrls[1];
            scope.el = element;
            var onClick = function(event) {
                var isChild = element[0].contains(event.target);
                var isSelf = element[0] == event.target;
                var isInside = isChild || isSelf;
                if (!isInside) {
                    bsBullet.deselect();
                }
            }
            $document.bind('click', onClick);
        }
        function BsBulletCtrl($scope) {
            var vm = this;
            var active = false;
            function onKey(event) {
                if (event.keyCode != 8 && event.keyCode != 46) return;
                $scope.deselect();
            }
            $scope.deselect = function() {
                $scope.bsDropdown.deselectOption($scope.bsOption);
            }
            vm.deselect = function() {
                if (active == false) return;
                active = false;
                $document.unbind('keydown', onKey);
            }
            $scope.select = function() {
                if (active == true) return;
                active = true;
                $document.bind('keydown', onKey);
            }
            $scope.$on('$destroy', function() {
                if (active) {
                    $document.unbind('keydown', onKey);
                }
            });
        }
    }])
})();