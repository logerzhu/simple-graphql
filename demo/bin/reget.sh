#!/bin/bash
#echo `dirname $0`
dir="simple-graphql"
git_url="https://github.com/kuncloud/simple-graphql.git"
des="src/utils/graphql-sequelize-helper"
echo $1
cd `pwd`
mkdir $1
cd $1

rm -rf $dir
mkdir $dir
cd $dir
git init
git remote rm origin
git remote add -f origin $git_url
git config core.sparsecheckout true
echo des >> .git/info/sparse-checkout
git pull origin master
cd ..
mv -f $dir/$des temp
rm -rf $dir
mv temp $dir
#rm -rf .git

