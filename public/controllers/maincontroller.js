

myApp.controller('MainCtrl', ['$scope', '$http', '$cookies', function($scope, $http, $cookies){
  //DECLARATIONS
  var socket = io();
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
  socket.on('room member test',function(data) {
    console.log(data);
  });
}]);