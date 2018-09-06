var myApp = angular.module('WhiteboardApp', []);

myApp.controller('LoginCtrl', ['$scope', '$http', function($scope, $http){
  $scope.signIn = function(){
    
  };
  $scope.signUp = function(){
    var newUser = {
      firstName: $scope.firstName,
      lastName: $scope.lastName,
      email: $scope.email,
      password: $scope.password
    };
    $http.post('/api/register', newUser).then(function(response){
      console.log(response);
      alert("new user created");
    });
  };
}]);