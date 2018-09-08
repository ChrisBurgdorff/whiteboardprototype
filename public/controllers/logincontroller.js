var myApp = angular.module('WhiteboardApp', []);

myApp.controller('LoginCtrl', ['$scope', '$http', function($scope, $http){
  $scope.signIn = function(){
    
  };
  $scope.signUp = function(){
    console.log("in signup function");
    var newUser = {
      firstName: $scope.firstName,
      lastName: $scope.lastName,
      email: $scope.newEmail,
      password: $scope.newPassword
    };
    $http({
      method: 'POST',
      url: '/api/register', 
      data: newUser})
      .then(function(response){
        if (response.status == 200) {
          console.log(response);
          alert("200 Error");
        } else if (response.status == 201) {
          alert("New user created");
        }
        else {
          alert("Something went wrong");
          console.log(response);
        }
    });
  };
}]);