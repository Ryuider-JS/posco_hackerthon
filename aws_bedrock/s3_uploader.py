import boto3
import os
from botocore.exceptions import ClientError
from pathlib import Path
from typing import Optional
import mimetypes


class S3Uploader:
    """AWS S3에 파일을 업로드하는 클래스"""
    
    def __init__(self, bucket_name: str, aws_access_key_id: Optional[str] = None, 
                 aws_secret_access_key: Optional[str] = None, region_name: str = 'ap-northeast-2'):
        """
        Args:
            bucket_name: S3 버킷 이름
            aws_access_key_id: AWS Access Key ID (환경변수에서 자동으로 가져올 수 있음)
            aws_secret_access_key: AWS Secret Access Key (환경변수에서 자동으로 가져올 수 있음)
            region_name: AWS 리전 (기본값: ap-northeast-2 - 서울)
        """
        self.bucket_name = bucket_name
        
        # AWS 자격 증명 설정
        if aws_access_key_id and aws_secret_access_key:
            self.s3_client = boto3.client(
                's3',
                aws_access_key_id=aws_access_key_id,
                aws_secret_access_key=aws_secret_access_key,
                region_name=region_name
            )
        else:
            # 환경변수나 AWS 자격 증명 파일 사용
            self.s3_client = boto3.client('s3', region_name=region_name)
    
    def upload_file(self, file_path: str, s3_key: Optional[str] = None, 
                   content_type: Optional[str] = None, public_read: bool = False) -> dict:
        """
        파일을 S3에 업로드
        
        Args:
            file_path: 업로드할 파일의 로컬 경로
            s3_key: S3에 저장될 키(경로) 이름 (None이면 파일명 사용)
            content_type: 파일의 MIME 타입 (None이면 자동 감지)
            public_read: 공개 읽기 권한 부여 여부
            
        Returns:
            dict: 업로드 결과 정보
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")
        
        # S3 키 설정
        if s3_key is None:
            s3_key = os.path.basename(file_path)
        
        # Content-Type 자동 감지
        if content_type is None:
            content_type, _ = mimetypes.guess_type(file_path)
            if content_type is None:
                content_type = 'application/octet-stream'
        
        # Content-Type 설정
        extra_args = {'ContentType': content_type}
        # 참고: 최신 S3 버킷은 ACL을 지원하지 않을 수 있습니다.
        # 공개 접근이 필요한 경우 버킷 정책을 사용하세요.
        # if public_read:
        #     extra_args['ACL'] = 'public-read'
        
        try:
            # 파일 업로드
            self.s3_client.upload_file(
                file_path,
                self.bucket_name,
                s3_key,
                ExtraArgs=extra_args
            )
            
            # 업로드된 파일의 URL 생성
            file_url = f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
            
            return {
                'success': True,
                'bucket_name': self.bucket_name,
                's3_key': s3_key,
                'file_url': file_url,
                'content_type': content_type
            }
            
        except ClientError as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def upload_file_object(self, file_object, s3_key: str, 
                          content_type: Optional[str] = None, public_read: bool = False) -> dict:
        """
        파일 객체를 S3에 업로드 (Flask/FastAPI의 request.files에서 받은 파일용)
        
        Args:
            file_object: 파일 객체 (파일 스트림)
            s3_key: S3에 저장될 키(경로) 이름
            content_type: 파일의 MIME 타입
            public_read: 공개 읽기 권한 부여 여부
            
        Returns:
            dict: 업로드 결과 정보
        """
        # Content-Type 설정
        if content_type is None:
            if hasattr(file_object, 'content_type'):
                content_type = file_object.content_type
            else:
                content_type = 'application/octet-stream'
        
        # Content-Type 설정
        extra_args = {'ContentType': content_type}
        # 참고: 최신 S3 버킷은 ACL을 지원하지 않을 수 있습니다.
        # 공개 접근이 필요한 경우 버킷 정책을 사용하세요.
        # if public_read:
        #     extra_args['ACL'] = 'public-read'
        
        try:
            # 파일 객체 업로드
            self.s3_client.upload_fileobj(
                file_object,
                self.bucket_name,
                s3_key,
                ExtraArgs=extra_args
            )
            
            # 업로드된 파일의 URL 생성
            file_url = f"https://{self.bucket_name}.s3.amazonaws.com/{s3_key}"
            
            return {
                'success': True,
                'bucket_name': self.bucket_name,
                's3_key': s3_key,
                'file_url': file_url,
                'content_type': content_type
            }
            
        except ClientError as e:
            return {
                'success': False,
                'error': str(e)
            }
    
    def delete_file(self, s3_key: str) -> bool:
        """
        S3에서 파일 삭제
        
        Args:
            s3_key: 삭제할 파일의 S3 키
            
        Returns:
            bool: 삭제 성공 여부
        """
        try:
            self.s3_client.delete_object(Bucket=self.bucket_name, Key=s3_key)
            return True
        except ClientError:
            return False
