/**
 * Created by bjwsl-001 on 2017/6/15.
 */

var app = angular.module('kfl', ['ionic']);

//自定义服务
app.service('$kflHttp',
  ['$http', '$ionicLoading',
    function ($http, $ionicLoading) {
      //url:请求的地址和参数 handleSucc:成功之后的处理函数
      this.sendRequest = function (url, handleSucc) {
        $ionicLoading.show({template: 'loading...'})
        $http
          .get(url)
          .success(function (data) {
            $ionicLoading.hide();
            handleSucc(data);
          })
      }

    }])


//配置状态
app.config(
  function ($stateProvider,
            $ionicConfigProvider,
            $urlRouterProvider) {

    //调整tabs固定在底部（无论是在哪个平台）
    $ionicConfigProvider.tabs.position('bottom');

    $stateProvider
      .state('kflStart', {
        url: '/kflStart',
        templateUrl: 'tpl/start.html'
      })
      .state('kflMain', {
        url: '/kflMain',
        templateUrl: 'tpl/main.html',
        controller: 'MainCtrl'
      })
      .state('kflDetail', {
        url: '/kflDetail/:id',
        templateUrl: 'tpl/detail.html',
        controller: 'DetailCtrl'
      })
      .state('kflOrder', {
        url: '/kflOrder/:cartDetail/:price',
        templateUrl: 'tpl/order.html',
        controller: 'OrderCtrl'
      })
      .state('kflMyOrder', {
        url: '/kflMyOrder',
        templateUrl: 'tpl/myOrder.html',
        controller: 'myOrderCtrl'
      })
      .state('kflCart', {
        url: '/kflCart',
        templateUrl: 'tpl/cart.html',
        controller: 'cartCtrl'
      })

    $urlRouterProvider.otherwise('/kflStart');

  })

//创建一个父控制器
app.controller('parentCtrl', ['$scope', '$state',
  function ($scope, $state) {

    $scope.jump = function (desState, arg) {
      $state.go(desState, arg);
    }
  }
]);

app.controller('MainCtrl', ['$scope', '$kflHttp',
  function ($scope, $kflHttp) {
    $scope.hasMore = true;
    $scope.dishList = [];
    //加载首页数据
    $kflHttp.sendRequest(
      'data/dish_getbypage.data',
      function (data) {
        console.log(data);
        $scope.dishList = data;
      })
    //给按钮定义一个处理函数：加载更多数据
    $scope.loadMore = function () {
      $kflHttp.sendRequest(
        'data/dish_getbypage.data?start=' + $scope.dishList.length,
        function (data) {
          if (data.length < 5) {
            $scope.hasMore = false;
          }
          $scope.dishList = $scope.dishList.concat(data);
          $scope.$broadcast('scroll.infiniteScrollComplete');
        }
      )
    }
    //在ng的项目中 如果需要用到方向2的绑定，也就是ngModel，官方建议是要将模型数据存储一个对象中

    $scope.inputTxt = {kw:''};
    //监听用户输入 的关键词进行搜索
    $scope.$watch('inputTxt.kw', function () {
      $kflHttp.sendRequest(
        'data/dish_getbykw.data?kw=' + $scope.inputTxt.kw,
        function (data) {
          if (data.length > 0) {
            $scope.dishList = data;
          }
        }
      )
    })
  }
]);

app.controller('DetailCtrl',
  ['$scope', '$kflHttp', '$stateParams', '$ionicPopup',
    function ($scope, $kflHttp, $stateParams, $ionicPopup) {
      console.log($stateParams);
      //定义方法，更新购物车信息
      $scope.addToCart = function () {
        //与服务器端通信
        $kflHttp.sendRequest(
          'data/cart_update.data?uid=1&did=' + $stateParams.id + "&count=-1",
          function (result) {
            console.log(result);
            //  将添加都购物车的结果弹窗显示
            $ionicPopup.alert({
              template: '添加到购物车成功'
            })
          }
        )
      };


      //发起网络请求，取指定id的详情信息并显示在视图
      $kflHttp.sendRequest(
        'data/dish_getbyid.data?id=' + $stateParams.id,
        function (data) {
          console.log(data);
          $scope.dish = data[0];
        }
      )
    }
  ])

app.controller('OrderCtrl',
  ['$scope', '$kflHttp', '$stateParams', '$httpParamSerializerJQLike',
    function ($scope, $kflHttp, $stateParams, $httpParamSerializerJQLike) {
      $scope.order = {
        userid:1,
        totalprice:$stateParams.price,
        cartDetail: $stateParams.cartDetail
      };

      $scope.submitOrder = function () {

        //系列化
        //①自己拼接 'user_name='+$scope.order.user_name+'&sex='+$scope.order.sex
        //②ng内置序列化服务
        //$httpParamSerializerJQLike
        var args = $httpParamSerializerJQLike($scope.order);
        console.log(args);

        $kflHttp.sendRequest(
          'data/order_add.data?' + args,
          function (data) {
            if (data.length > 0) {
              if (data[0].msg == 'succ') {
                sessionStorage.setItem(
                  'phone', $scope.order.phone);
                $scope.result = '下单成功，订单编号为' + data[0].oid;
              }
              else {
                $scope.result = '下单失败'
              }
            }
          }
        )

      }
    }
  ])

app.controller('myOrderCtrl', ['$scope', '$kflHttp',
  function ($scope, $kflHttp) {
    var userPhone = sessionStorage.getItem('phone');
    $kflHttp
      .sendRequest(
      'data/order_getbyuserid.data?userid=1',
      function (result) {
        console.log(result);

        $scope.orderList = result.data;
      }
    )
  }
])

app.controller('cartCtrl', ['$scope', '$kflHttp',
  function ($scope, $kflHttp) {

    $scope.editEnable = false;
    $scope.editText = '编辑'
    $scope.cart = [];//购物车对象数组
    $scope.toggleEdit = function () {
      $scope.editEnable = !$scope.editEnable;
      if ($scope.editEnable) {
        $scope.editText = '完成'
      }
      else {
        $scope.editText = '编辑'
      }
    };

    //请求服务器端，读取指定用户的购物车的数据
    $kflHttp.sendRequest(
      'data/cart_select.data?uid=1',
      function (result) {
        console.log(result);
        $scope.cart = result.data;
      }
    );

    function update(did, count) {
      $kflHttp.sendRequest(
        'data/cart_update.data?uid=1&did=' + did + "&count=" + count,
        function (result) {
          console.log(result);
        }
      )
    }
    $scope.minus = function (index) {
      //将产品的数据减1
      var dish = $scope.cart[index];
      if (dish.dishCount == 1) {
        return
      }
      else {
        dish.dishCount--;
        update(dish.did, dish.dishCount);
      }
    };

    $scope.add = function (index) {
      //将产品的数据加1
      var dish = $scope.cart[index];
      console.log(dish);
      dish.dishCount++;
      update(dish.did, dish.dishCount);

    };
    
    $scope.sumAll = function () {
      result = 0;
      for(var i =0;i<$scope.cart.length;i++)
      {
        var dish = $scope.cart[i];
        result += (dish.price * dish.dishCount);
      }
      return result;
    };

    $scope.jumpToOrder = function () {

      //准备要传递的参数
      var totalPrice = $scope.sumAll();
      //json格式的序列化（将一个普通的对象或者数组 序列化 json格式的字符串）
      var detail = angular.toJson($scope.cart);

      $scope.jump('kflOrder',{cartDetail:detail,price:totalPrice});

    }

  }
]);






