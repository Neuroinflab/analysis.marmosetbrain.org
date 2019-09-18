import os, inspect
import sys
import re
import math
import csv
import json
from ConfigParser import ConfigParser, NoOptionError
import logging
import shutil

import warnings
from cStringIO import StringIO
from collections import namedtuple

from boto.s3.connection import S3Connection
from boto.s3.key import Key

import psycopg2
import psycopg2.extras
import msgpack

from fabric.api import local, run, get, put, hosts, roles, cd, task, env
from fabric.tasks import Task
from fabric.colors import green, red, yellow
from fabric.contrib.console import confirm
#env.hosts = ['mitradevel']
env.roledefs['webservers'] = ['eu1.mrosa.org']
env.roledefs['dbservers'] = ['mitradevel']
env.user = 'baishi'

#warnings.simplefilter('ignore', Image.DecompressionBombWarning)

FORMAT = '%(asctime)s %(levelname)-5.5s [%(name)s] %(funcName)s:%(lineno)d %(message)s'
logging.basicConfig(format=FORMAT, level=logging.INFO)

logger = logging.getLogger(__name__)

#python_bin = '/opt/python/bin/python'

class DeployTask(Task):
    def __init__(self, func, *args, **kwargs):
        super(DeployTask, self).__init__(*args, **kwargs)
        self.roles = ['webservers']

    def __del__(self):
        pass

    def run(self, *arg, **kwargs):
        with cd('git/marmoset_analysis'):
            run('git pull')

@task(task_class=DeployTask)
def deploy():
    pass

