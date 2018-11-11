

myApp.controller('MainCtrl', ['$scope', '$http', '$cookies', function($scope, $http, $cookies){
  //DECLARATIONS
  var socket = io();
  //$scope.userList = [{firstName: "CHRIS"}];
  //HELPER FUNCTIONS
  function getUserIfCookie() {
    if ($cookies.get('email')) {
      var email = $cookies.get('email');
      console.log(email);
      $http({
        method: 'GET',
        url: '/api/user/' + email
      }).then(function(result){
        console.log("IN getUserIfCookie");
        console.log(result.data);
        $scope.currentUserId = result.data._id;
        $scope.currentFirstName = result.data.firstName;
        $scope.currentLastName = result.data.lastName;
        $scope.currentEmail = result.data.email;
        $scope.currentGroup = result.data.group;
        var userData = {
          "email": result.data.email,
          "firstName": result.data.firstName,
          "group": result.data.group,
          "lastName": result.data.lastName,
          "_id": result.data._id
        };
        socket.emit('add user', userData);
      });
    }    
  }
  //RUN THIS TO GET DATA
  getUserIfCookie();
  //Scope functions
  $scope.startChat = function(user) {
    $("#chat").show();
    $scope.chatTo = user.firstName + " " + user.lastName;
    $scope.chatSocket = user.socket;
  };
  $scope.sendMessage = function() {
    
  };
  //Socket.io functions
  socket.on('user update',function(data) {
    console.log(data);
    console.log(data.socketList);
    console.log(data.clientList);
    $scope.userList = data.clientList;
    for(var i = 0; i < 2; i++) {
      var newUser = {
        firstName: 'user'
      };
      //$scope.userList.push(newUser);
    }
      console.log(newUser);
      console.log($scope.userList);
      //alert($scope.userList[0].firstName);
      $scope.$apply();
  });
}]);