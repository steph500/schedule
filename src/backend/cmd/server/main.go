package main

import (
	"flag"
	"fmt"
	"log"
	"net"

	"backend/gen/schedulepb"
	"backend/internal/service"
	"backend/internal/store"

	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"
)

func main() {
	addr := flag.String("addr", ":50051", "listen address")
	data := flag.String("data", "", "optional JSON persistence file, e.g. ./data/appointments.json")
	flag.Parse()

	s, err := store.New(*data)
	if err != nil {
		log.Fatalf("failed to init store: %v", err)
	}

	lis, err := net.Listen("tcp", *addr)
	if err != nil {
		log.Fatalf("failed to listen on %s: %v", *addr, err)
	}

	grpcServer := grpc.NewServer()
	svc := service.New(s)
	schedulepb.RegisterScheduleServiceServer(grpcServer, svc)
	reflection.Register(grpcServer)

	log.Printf("ScheduleService listening on %s (data=%q)", *addr, *data)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("server error: %v", err)
	}
	fmt.Println("shutdown")
}
