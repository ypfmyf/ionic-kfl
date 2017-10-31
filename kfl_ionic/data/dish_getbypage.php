<?php
header('Content-Type:application/json');

@$start = $_REQUEST['start'];
if(empty($start)){
  $start = 0;
}


require('init.php');
$sql = "SELECT did,name,img_sm,material,price FROM kf_dish LIMIT $start,5";

$result = mysqli_query($conn,$sql);
$output = [];

while(true){
  $row = mysqli_fetch_assoc($result);
  if(!$row)
  {
    break;
  }
  $output[] = $row;
}

echo json_encode($output);



?>